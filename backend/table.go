package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

const maxRows = 1000 // we read A1:Z1000, the same range the frontend reads

var (
	errRowNotFound = errors.New("row not found")
	errSheetFull   = errors.New("sheet is full")
)

type missingColumnError struct{ column string }

func (e *missingColumnError) Error() string {
	return fmt.Sprintf("the sheet has no %q column", e.column)
}

// fieldKind decides how a value is turned into a sheet cell.
type fieldKind int

const (
	kindText fieldKind = iota // plain text, written as-is
	kindBool                  // true / false, for checkbox cells
	kindDate                  // "2006-01-02"
	kindTime                  // "15:04"
)

// column describes one field of a tab. Header names are matched ignoring case,
// spaces and underscores, the same way the frontend matches them.
type column struct {
	key     string
	aliases []string
	kind    fieldKind
}

type tableSpec struct {
	name    string // for error messages
	idKey   string // which column holds the unique id
	columns []column
}

type sheetTable struct {
	svc     *sheets.Service
	sheetID string
	tab     string
	spec    tableSpec

	mu       sync.Mutex // one change at a time, so row lookups and writes never interleave
	gid      int64      // numeric id of the tab, looked up once when first needed
	gidKnown bool
}

func newSheetsService(ctx context.Context) (*sheets.Service, error) {
	return sheets.NewService(ctx, option.WithScopes(sheets.SpreadsheetsScope))
}

func newTable(svc *sheets.Service, sheetID, tab string, spec tableSpec) *sheetTable {
	return &sheetTable{svc: svc, sheetID: sheetID, tab: tab, spec: spec}
}

// cells builds an A1 reference with the tab name safely quoted.
func (t *sheetTable) cells(a1 string) string {
	return "'" + strings.ReplaceAll(t.tab, "'", "''") + "'!" + a1
}

func normalizeHeader(h any) string {
	var b strings.Builder
	for _, r := range strings.ToLower(fmt.Sprint(h)) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// We only read columns A to Z, so a column index is always a single letter.
func colLetter(index int) string { return string(rune('A' + index)) }

// cellText turns any cell value into trimmed text.
func cellText(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(x)
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	default:
		return strings.TrimSpace(fmt.Sprint(x))
	}
}

// ---- reading ---------------------------------------------------------------

// snapshot is the tab as it is right now. Values come "unformatted", so dates and
// times arrive as numbers and text arrives as text. That lets us tell which kind of
// cell a column holds and write the same kind back.
type snapshot struct {
	rows      [][]any // rows[0] is the header row
	cols      map[string]int
	idCol     int
	lastIDRow int // 1-based sheet row of the last non-empty id (1 when there are no rows yet)
}

func (t *sheetTable) read(ctx context.Context) (*snapshot, error) {
	resp, err := t.svc.Spreadsheets.Values.Get(t.sheetID, t.cells("A1:Z1000")).
		ValueRenderOption("UNFORMATTED_VALUE").Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", t.spec.name, err)
	}
	if len(resp.Values) == 0 {
		return nil, &missingColumnError{t.spec.idKey}
	}

	snap := &snapshot{rows: resp.Values, cols: map[string]int{}, lastIDRow: 1}
	for _, c := range t.spec.columns {
		for i, h := range resp.Values[0] {
			if slices.Contains(c.aliases, normalizeHeader(h)) {
				snap.cols[c.key] = i
				break
			}
		}
	}

	idCol, ok := snap.cols[t.spec.idKey]
	if !ok {
		return nil, &missingColumnError{t.spec.idKey}
	}
	snap.idCol = idCol

	for i := 1; i < len(snap.rows); i++ {
		if cellText(snap.cell(i, idCol)) != "" {
			snap.lastIDRow = i + 1
		}
	}
	return snap, nil
}

// cell returns the value at a 0-based row and column, or nil when it is empty.
func (s *snapshot) cell(row, col int) any {
	if row < 0 || row >= len(s.rows) || col >= len(s.rows[row]) {
		return nil
	}
	return s.rows[row][col]
}

// findRow returns the 1-based sheet row with this id, or 0 when there is none.
func (s *snapshot) findRow(id string) int {
	for i := 1; i < len(s.rows); i++ {
		if cellText(s.cell(i, s.idCol)) == id {
			return i + 1
		}
	}
	return 0
}

func (s *snapshot) ids() []string {
	var out []string
	for i := 1; i < len(s.rows); i++ {
		if id := cellText(s.cell(i, s.idCol)); id != "" {
			out = append(out, id)
		}
	}
	return out
}

// sample returns a real value from the bottom-most filled row of a column,
// which shows what kind of cell the column holds (number, text...).
func (s *snapshot) sample(col int) any {
	for i := len(s.rows) - 1; i >= 1; i-- {
		if cellText(s.cell(i, s.idCol)) == "" {
			continue
		}
		if v := s.cell(i, col); v != nil && v != "" {
			return v
		}
	}
	return nil
}

// ---- writing ---------------------------------------------------------------

var excelEpoch = time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)

// encodeValue turns a validated value into what goes in the cell. A date or time
// is written as a real date or time when the column already holds real ones
// (sample is a number), and as text when the column holds text. Everything is sent
// as RAW, so nothing the user types can ever run as a formula.
func encodeValue(kind fieldKind, v, sample any) (any, error) {
	_, sampleIsNumber := sample.(float64)

	switch kind {
	case kindBool:
		b, ok := v.(bool)
		if !ok {
			return nil, errors.New("expected true or false")
		}
		return b, nil

	case kindDate:
		s, _ := v.(string)
		d, err := time.Parse("2006-01-02", s)
		if err != nil {
			return nil, fmt.Errorf("bad date %q", s)
		}
		if sampleIsNumber {
			return d.Sub(excelEpoch).Hours() / 24, nil // days since 30 Dec 1899
		}
		return s, nil

	case kindTime:
		s, _ := v.(string)
		tm, err := time.Parse("15:04", s)
		if err != nil {
			return nil, fmt.Errorf("bad time %q", s)
		}
		if sampleIsNumber {
			return float64(tm.Hour()*60+tm.Minute()) / 1440, nil // fraction of a day
		}
		return s, nil

	default:
		s, _ := v.(string)
		return s, nil
	}
}

func isBlankText(v any) bool {
	s, ok := v.(string)
	return ok && s == ""
}

// cellWrites builds one write per field for the given 1-based sheet row.
func (t *sheetTable) cellWrites(snap *snapshot, row int, fields map[string]any) ([]*sheets.ValueRange, error) {
	kinds := make(map[string]fieldKind, len(t.spec.columns))
	for _, c := range t.spec.columns {
		kinds[c.key] = c.kind
	}

	var data []*sheets.ValueRange
	for key, value := range fields {
		col, ok := snap.cols[key]
		if !ok {
			if isBlankText(value) {
				continue // an optional column this sheet doesn't have
			}
			return nil, &missingColumnError{key}
		}

		sample := snap.cell(row-1, col)
		if sample == nil || sample == "" {
			sample = snap.sample(col)
		}

		encoded, err := encodeValue(kinds[key], value, sample)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", key, err)
		}
		data = append(data, &sheets.ValueRange{
			Range:  t.cells(fmt.Sprintf("%s%d", colLetter(col), row)),
			Values: [][]any{{encoded}},
		})
	}
	return data, nil
}

func (t *sheetTable) write(ctx context.Context, data []*sheets.ValueRange) error {
	if len(data) == 0 {
		return nil
	}
	req := &sheets.BatchUpdateValuesRequest{ValueInputOption: "RAW", Data: data}
	if _, err := t.svc.Spreadsheets.Values.BatchUpdate(t.sheetID, req).Context(ctx).Do(); err != nil {
		return fmt.Errorf("write %s: %w", t.spec.name, err)
	}
	return nil
}

// Update changes the given fields on the row with this id.
func (t *sheetTable) Update(ctx context.Context, id string, fields map[string]any) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	snap, err := t.read(ctx)
	if err != nil {
		return err
	}
	row := snap.findRow(id)
	if row == 0 {
		return errRowNotFound
	}

	data, err := t.cellWrites(snap, row, fields)
	if err != nil {
		return err
	}
	return t.write(ctx, data)
}

// Append adds a new row below the last one and returns its id.
// newID is given the ids already in use and must return an unused one.
func (t *sheetTable) Append(ctx context.Context, fields map[string]any, newID func(existing []string) string) (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	snap, err := t.read(ctx)
	if err != nil {
		return "", err
	}

	row := snap.lastIDRow + 1
	if row > maxRows {
		return "", errSheetFull
	}

	id := newID(snap.ids())
	all := make(map[string]any, len(fields)+1)
	for k, v := range fields {
		all[k] = v
	}
	all[t.spec.idKey] = id

	data, err := t.cellWrites(snap, row, all)
	if err != nil {
		return "", err
	}

	// The new row copies the look of the row above it, so numeric dates and times
	// display as dates and times instead of plain numbers. Formatting is cosmetic,
	// so it runs alongside the value write; a formatting failure must not make a
	// task that was saved look unsaved.
	formatDone := make(chan error, 1)
	if snap.lastIDRow >= 2 {
		go func() { formatDone <- t.copyRowFormat(ctx, snap.lastIDRow, row) }()
	} else {
		formatDone <- nil
	}
	writeErr := t.write(ctx, data)
	if formatErr := <-formatDone; formatErr != nil {
		slog.Warn("copy row formatting", "table", t.spec.name, "row", row, "error", formatErr)
	}
	if writeErr != nil {
		return "", writeErr
	}
	return id, nil
}

// tabGID returns the tab's numeric id, which formatting requests need.
func (t *sheetTable) tabGID(ctx context.Context) (int64, error) {
	if t.gidKnown {
		return t.gid, nil
	}
	resp, err := t.svc.Spreadsheets.Get(t.sheetID).
		Fields("sheets.properties(sheetId,title)").Context(ctx).Do()
	if err != nil {
		return 0, fmt.Errorf("look up tab %q: %w", t.tab, err)
	}
	for _, s := range resp.Sheets {
		if s.Properties != nil && s.Properties.Title == t.tab {
			t.gid, t.gidKnown = s.Properties.SheetId, true
			return t.gid, nil
		}
	}
	return 0, fmt.Errorf("tab %q not found", t.tab)
}

// copyRowFormat copies number formats, checkboxes and colours from one row to another.
func (t *sheetTable) copyRowFormat(ctx context.Context, fromRow, toRow int) error {
	gid, err := t.tabGID(ctx)
	if err != nil {
		return err
	}

	span := func(row int) *sheets.GridRange {
		return &sheets.GridRange{
			SheetId:          gid,
			StartRowIndex:    int64(row - 1),
			EndRowIndex:      int64(row),
			StartColumnIndex: 0,
			EndColumnIndex:   26,
		}
	}
	req := &sheets.BatchUpdateSpreadsheetRequest{
		Requests: []*sheets.Request{{
			CopyPaste: &sheets.CopyPasteRequest{
				Source:           span(fromRow),
				Destination:      span(toRow),
				PasteType:        "PASTE_FORMAT",
				PasteOrientation: "NORMAL",
			},
		}},
	}
	if _, err := t.svc.Spreadsheets.BatchUpdate(t.sheetID, req).Context(ctx).Do(); err != nil {
		return fmt.Errorf("copy formatting: %w", err)
	}
	return nil
}
