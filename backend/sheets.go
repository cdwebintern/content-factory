package main

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"

	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

var errTaskNotFound = errors.New("task not found")

type missingColumnError struct{ column string }

func (e *missingColumnError) Error() string {
	return fmt.Sprintf("the sheet has no %q column", e.column)
}

// taskPatch holds the fields a client wants to change. A nil field means "leave it alone".
type taskPatch struct {
	Title    *string `json:"title"`
	Due      *string `json:"due"`
	Priority *string `json:"priority"`
	Done     *bool   `json:"done"`
}

// Header names are matched ignoring case, spaces and underscores,
// the same way the frontend matches them.
var columnAliases = map[string][]string{
	"id":       {"id", "taskid"},
	"title":    {"title", "tasktitle", "taskname", "task", "name"},
	"due":      {"due", "duedate", "deadline"},
	"priority": {"priority"},
	"done":     {"done", "completed", "iscompleted"},
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

// findColumns maps each field name to its 0-based column index in the header row.
func findColumns(header []any) map[string]int {
	cols := map[string]int{}
	for field, names := range columnAliases {
		for i, h := range header {
			if slices.Contains(names, normalizeHeader(h)) {
				cols[field] = i
				break
			}
		}
	}
	return cols
}

// We only read columns A to Z, so a column index is always a single letter.
func colLetter(index int) string { return string(rune('A' + index)) }

type sheetStore struct {
	svc     *sheets.Service
	sheetID string
	tab     string
	mu      sync.Mutex // one write at a time, so row lookups and writes never interleave
}

// newSheetStore uses the credentials in GOOGLE_APPLICATION_CREDENTIALS
// (or the attached service account when running on Google Cloud).
func newSheetStore(ctx context.Context, cfg config) (*sheetStore, error) {
	svc, err := sheets.NewService(ctx, option.WithScopes(sheets.SpreadsheetsScope))
	if err != nil {
		return nil, err
	}
	return &sheetStore{svc: svc, sheetID: cfg.SheetID, tab: cfg.TasksTab}, nil
}

// cells builds an A1 reference with the tab name safely quoted.
func (s *sheetStore) cells(a1 string) string {
	return "'" + strings.ReplaceAll(s.tab, "'", "''") + "'!" + a1
}

// UpdateTask finds the row whose id matches and changes only the fields in p.
// It returns the names of the fields that were written.
func (s *sheetStore) UpdateTask(ctx context.Context, id string, p taskPatch) ([]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	resp, err := s.svc.Spreadsheets.Values.Get(s.sheetID, s.cells("A1:Z1000")).Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("read sheet: %w", err)
	}
	if len(resp.Values) == 0 {
		return nil, errTaskNotFound
	}

	cols := findColumns(resp.Values[0])
	idCol, ok := cols["id"]
	if !ok {
		return nil, &missingColumnError{"id"}
	}

	row := 0 // 1-based sheet row, 0 means not found
	for i, r := range resp.Values[1:] {
		if idCol < len(r) && strings.TrimSpace(fmt.Sprint(r[idCol])) == id {
			row = i + 2 // row 1 is the header
			break
		}
	}
	if row == 0 {
		return nil, errTaskNotFound
	}

	// Text goes in as RAW so a title like "=IMPORTDATA(...)" stays plain text and can
	// never run as a formula. The date is validated as yyyy-mm-dd first, so it is safe
	// to send as USER_ENTERED, which makes Sheets store a real date and keep the
	// column's date format.
	var raw, entered []*sheets.ValueRange
	var changed []string

	queue := func(field string, value any, dst *[]*sheets.ValueRange) error {
		col, found := cols[field]
		if !found {
			return &missingColumnError{field}
		}
		*dst = append(*dst, &sheets.ValueRange{
			Range:  s.cells(fmt.Sprintf("%s%d", colLetter(col), row)),
			Values: [][]any{{value}},
		})
		changed = append(changed, field)
		return nil
	}

	if p.Title != nil {
		if err := queue("title", *p.Title, &raw); err != nil {
			return nil, err
		}
	}
	if p.Priority != nil {
		if err := queue("priority", *p.Priority, &raw); err != nil {
			return nil, err
		}
	}
	if p.Done != nil {
		if err := queue("done", *p.Done, &raw); err != nil {
			return nil, err
		}
	}
	if p.Due != nil {
		if err := queue("due", *p.Due, &entered); err != nil {
			return nil, err
		}
	}

	if len(raw) > 0 {
		if err := s.write(ctx, "RAW", raw); err != nil {
			return nil, err
		}
	}
	if len(entered) > 0 {
		if err := s.write(ctx, "USER_ENTERED", entered); err != nil {
			return nil, err
		}
	}
	return changed, nil
}

func (s *sheetStore) write(ctx context.Context, mode string, data []*sheets.ValueRange) error {
	req := &sheets.BatchUpdateValuesRequest{ValueInputOption: mode, Data: data}
	if _, err := s.svc.Spreadsheets.Values.BatchUpdate(s.sheetID, req).Context(ctx).Do(); err != nil {
		return fmt.Errorf("write sheet: %w", err)
	}
	return nil
}
