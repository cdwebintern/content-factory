package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"google.golang.org/api/googleapi"
)

var priorities = []string{"low", "medium", "high", "urgent"}

// validate checks the patch and tidies it (trimmed title, lower-case priority).
func (p *taskPatch) validate() error {
	if p.Title == nil && p.Due == nil && p.Priority == nil && p.Done == nil {
		return errors.New("send at least one of: title, due, priority, done")
	}

	if p.Title != nil {
		t := strings.TrimSpace(*p.Title)
		switch {
		case t == "":
			return errors.New("title cannot be empty")
		case utf8.RuneCountInString(t) > 120:
			return errors.New("title must be 120 characters or fewer")
		case strings.ContainsFunc(t, unicode.IsControl):
			return errors.New("title cannot contain control characters")
		}
		p.Title = &t
	}

	if p.Due != nil {
		d, err := time.Parse("2006-01-02", *p.Due)
		if err != nil || d.Format("2006-01-02") != *p.Due || d.Year() < 2000 || d.Year() > 2100 {
			return errors.New("due must be a real date written as yyyy-mm-dd")
		}
	}

	if p.Priority != nil {
		pr := strings.ToLower(strings.TrimSpace(*p.Priority))
		if !slices.Contains(priorities, pr) {
			return fmt.Errorf("priority must be one of: %s", strings.Join(priorities, ", "))
		}
		p.Priority = &pr
	}

	return nil
}

type server struct {
	store *sheetStore
}

// PATCH /api/tasks/{id}  with a JSON body such as {"done": true} or {"title": "New name"}
func (s *server) updateTask(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" || len(id) > 100 {
		writeError(w, http.StatusBadRequest, "invalid task id")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var patch taskPatch
	if err := dec.Decode(&patch); err != nil {
		writeError(w, http.StatusBadRequest, "request body must be JSON with title, due, priority or done")
		return
	}
	if err := patch.validate(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	changed, err := s.store.UpdateTask(ctx, id, patch)
	if err != nil {
		status, msg := describeError(err)
		if status >= 500 {
			slog.Error("update task", "id", id, "error", err)
		}
		writeError(w, status, msg)
		return
	}

	slog.Info("task updated", "id", id, "fields", changed, "by", emailFrom(r.Context()))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "updated": changed})
}

// describeError turns an internal error into an HTTP status and a safe, useful message.
func describeError(err error) (int, string) {
	var missing *missingColumnError
	var gerr *googleapi.Error

	switch {
	case errors.Is(err, errTaskNotFound):
		return http.StatusNotFound, "no task with that id in the sheet"
	case errors.As(err, &missing):
		return http.StatusUnprocessableEntity, missing.Error()
	case errors.Is(err, context.DeadlineExceeded):
		return http.StatusGatewayTimeout, "Google took too long to respond"
	case errors.As(err, &gerr) && gerr.Code == http.StatusForbidden:
		return http.StatusBadGateway, "the server cannot edit the sheet; share it with the service account as Editor"
	case errors.As(err, &gerr) && gerr.Code == http.StatusNotFound:
		return http.StatusBadGateway, "the spreadsheet or tab was not found; check SHEET_ID and TASKS_TAB"
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
