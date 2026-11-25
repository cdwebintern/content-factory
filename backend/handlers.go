package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"slices"
	"sort"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"google.golang.org/api/googleapi"
)

type server struct {
	tasks    *sheetTable
	meetings *sheetTable
}

// ---- validation helpers ----------------------------------------------------

func cleanText(label, s string, limit int, required bool) (string, error) {
	s = strings.TrimSpace(s)
	switch {
	case required && s == "":
		return "", fmt.Errorf("%s cannot be empty", label)
	case utf8.RuneCountInString(s) > limit:
		return "", fmt.Errorf("%s must be %d characters or fewer", label, limit)
	case strings.ContainsFunc(s, unicode.IsControl):
		return "", fmt.Errorf("%s cannot contain line breaks or control characters", label)
	}
	return s, nil
}

func cleanDate(s string) (string, error) {
	s = strings.TrimSpace(s)
	d, err := time.Parse("2006-01-02", s)
	if err != nil || d.Format("2006-01-02") != s || d.Year() < 2000 || d.Year() > 2100 {
		return "", errors.New("date must be a real date written as yyyy-mm-dd")
	}
	return s, nil
}

func cleanClock(s string) (string, error) {
	s = strings.TrimSpace(s)
	tm, err := time.Parse("15:04", s)
	if err != nil || tm.Format("15:04") != s {
		return "", errors.New("times must be written as HH:MM, for example 09:30")
	}
	return s, nil
}

// cleanLink accepts only web addresses. An empty link is allowed and clears the cell.
func cleanLink(s string) (string, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", nil
	}
	if utf8.RuneCountInString(s) > 500 {
		return "", errors.New("link must be 500 characters or fewer")
	}
	u, err := url.Parse(s)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" {
		return "", errors.New("link must be a web address starting with https:// or http://")
	}
	return s, nil
}

func cleanChoice(label, s string, allowed []string) (string, error) {
	v := strings.ToLower(strings.TrimSpace(s))
	if !slices.Contains(allowed, v) {
		return "", fmt.Errorf("%s must be one of: %s", label, strings.Join(allowed, ", "))
	}
	return v, nil
}

// ---- request helpers -------------------------------------------------------

func pathID(r *http.Request) (string, bool) {
	id := strings.TrimSpace(r.PathValue("id"))
	return id, id != "" && len(id) <= 100
}

// decodeBody reads a small JSON body and rejects unknown fields.
// It writes the error reply itself and returns false when the body is unusable.
func decodeBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "request body must be valid JSON with known fields")
		return false
	}
	return true
}

// fieldNames lists the field names in a stable order.
func fieldNames(fields map[string]any) []string {
	names := make([]string, 0, len(fields))
	for name := range fields {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

// ---- replies ---------------------------------------------------------------

func replyError(w http.ResponseWriter, what, id string, err error) {
	status, msg := describeError(err)
	if status >= 500 {
		slog.Error(what, "id", id, "error", err)
	}
	writeError(w, status, msg)
}

// describeError turns an internal error into an HTTP status and a safe, useful message.
func describeError(err error) (int, string) {
	var missing *missingColumnError
	var gerr *googleapi.Error

	switch {
	case errors.Is(err, errRowNotFound):
		return http.StatusNotFound, "nothing with that id in the sheet"
	case errors.Is(err, errSheetFull):
		return http.StatusConflict, fmt.Sprintf("the sheet has no free rows (limit %d)", maxRows)
	case errors.As(err, &missing):
		return http.StatusUnprocessableEntity, missing.Error()
	case errors.Is(err, context.DeadlineExceeded):
		return http.StatusGatewayTimeout, "Google took too long to respond"
	case errors.As(err, &gerr) && gerr.Code == http.StatusForbidden:
		return http.StatusBadGateway, "the server cannot edit the sheet; share it with the service account as Editor"
	case errors.As(err, &gerr) && gerr.Code == http.StatusNotFound:
		return http.StatusBadGateway, "the spreadsheet or tab was not found; check SHEET_ID, TASKS_TAB and MEETINGS_TAB"
	case errors.As(err, &gerr) && gerr.Code == http.StatusTooManyRequests:
		return http.StatusServiceUnavailable, "Google is limiting requests; try again in a minute"
	default:
		return http.StatusBadGateway, "could not update the sheet"
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("write response", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
