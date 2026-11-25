package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var meetingSpec = tableSpec{
	name:  "meetings",
	idKey: "id",
	columns: []column{
		{"id", []string{"meetingid", "id"}, kindText},
		{"title", []string{"meetingtitle", "title"}, kindText},
		{"description", []string{"description"}, kindText},
		{"date", []string{"date"}, kindDate},
		{"start", []string{"starttime", "start"}, kindTime},
		{"end", []string{"endtime", "end"}, kindTime},
		{"attendees", []string{"attendees"}, kindText},
		{"link", []string{"meetinglink", "link"}, kindText},
		{"status", []string{"status"}, kindText},
		{"priority", []string{"priority"}, kindText},
	},
}

var (
	meetingStatuses   = []string{"scheduled", "completed", "cancelled"}
	meetingPriorities = []string{"low", "medium", "high"}
)

// meetingPatch is used both to change a meeting and to create one.
// A nil field means "leave it alone" (or "use the default" when creating).
type meetingPatch struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Date        *string `json:"date"`
	Start       *string `json:"start"`
	End         *string `json:"end"`
	Attendees   *string `json:"attendees"`
	Link        *string `json:"link"`
	Status      *string `json:"status"`
	Priority    *string `json:"priority"`
}

func (p *meetingPatch) empty() bool {
	return p.Title == nil && p.Description == nil && p.Date == nil && p.Start == nil &&
		p.End == nil && p.Attendees == nil && p.Link == nil && p.Status == nil && p.Priority == nil
}

// applyDefaults is for new meetings: it requires the essentials and fills in the rest.
func (p *meetingPatch) applyDefaults() error {
	if p.Title == nil || p.Date == nil || p.Start == nil || p.End == nil {
		return errors.New("title, date, start and end are required")
	}
	if p.Status == nil {
		s := "scheduled"
		p.Status = &s
	}
	if p.Priority == nil {
		s := "medium"
		p.Priority = &s
	}
	return nil
}

// validate checks every field that is present and tidies it.
func (p *meetingPatch) validate() error {
	if p.empty() {
		return errors.New("send at least one field to change")
	}

	clean := func(field **string, fn func(string) (string, error)) error {
		if *field == nil {
			return nil
		}
		v, err := fn(**field)
		if err != nil {
			return err
		}
		*field = &v
		return nil
	}

	results := []error{
		clean(&p.Title, func(s string) (string, error) { return cleanText("title", s, 120, true) }),
		clean(&p.Description, func(s string) (string, error) { return cleanText("description", s, 500, false) }),
		clean(&p.Date, cleanDate),
		clean(&p.Start, cleanClock),
		clean(&p.End, cleanClock),
		clean(&p.Attendees, func(s string) (string, error) { return cleanText("attendees", s, 200, false) }),
		clean(&p.Link, cleanLink),
		clean(&p.Status, func(s string) (string, error) { return cleanChoice("status", s, meetingStatuses) }),
		clean(&p.Priority, func(s string) (string, error) { return cleanChoice("priority", s, meetingPriorities) }),
	}
	for _, err := range results {
		if err != nil {
			return err
		}
	}

	// "HH:MM" strings compare correctly as text
	if p.Start != nil && p.End != nil && *p.End <= *p.Start {
		return errors.New("end must be after start")
	}
	return nil
}

func titleCase(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

// fields returns the values to write. Status and priority are written the way
// the sheet already shows them: "Scheduled", "High".
func (p *meetingPatch) fields() map[string]any {
	f := map[string]any{}
	set := func(key string, v *string) {
		if v != nil {
			f[key] = *v
		}
	}
	set("title", p.Title)
	set("description", p.Description)
	set("date", p.Date)
	set("start", p.Start)
	set("end", p.End)
	set("attendees", p.Attendees)
	set("link", p.Link)
	if p.Status != nil {
		f["status"] = titleCase(*p.Status)
	}
	if p.Priority != nil {
		f["priority"] = titleCase(*p.Priority)
	}
	return f
}

var meetingIDPattern = regexp.MustCompile(`(?i)^M(\d+)$`)

// nextMeetingID continues the M001, M002... sequence and never reuses an id.
func nextMeetingID(existing []string) string {
	highest := 0
	taken := make(map[string]bool, len(existing))

	for _, id := range existing {
		taken[strings.ToUpper(id)] = true
		if m := meetingIDPattern.FindStringSubmatch(id); m != nil {
			if n, err := strconv.Atoi(m[1]); err == nil && n > highest {
				highest = n
			}
		}
	}
	for n := highest + 1; ; n++ {
		if id := fmt.Sprintf("M%03d", n); !taken[id] {
			return id
		}
	}
}

// PATCH /api/meetings/{id}  with any of: title, description, date, start, end,
// attendees, link, status, priority
func (s *server) updateMeeting(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid meeting id")
		return
	}

	var patch meetingPatch
	if !decodeBody(w, r, &patch) {
		return
	}
	if err := patch.validate(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	fields := patch.fields()
	if err := s.meetings.Update(ctx, id, fields); err != nil {
		replyError(w, "update meeting", id, err)
		return
	}

	slog.Info("meeting updated", "id", id, "fields", fieldNames(fields), "by", emailFrom(r.Context()))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "updated": fieldNames(fields)})
}

// POST /api/meetings  needs title, date, start and end. Status defaults to
// "scheduled" and priority to "medium". The server picks the id (M011, M012...).
func (s *server) createMeeting(w http.ResponseWriter, r *http.Request) {
	var patch meetingPatch
	if !decodeBody(w, r, &patch) {
		return
	}
	if err := patch.applyDefaults(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	if err := patch.validate(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
	defer cancel()

	id, err := s.meetings.Append(ctx, patch.fields(), nextMeetingID)
	if err != nil {
		replyError(w, "create meeting", "", err)
		return
	}

	slog.Info("meeting created", "id", id, "by", emailFrom(r.Context()))
	writeJSON(w, http.StatusCreated, map[string]string{"id": id})
}
