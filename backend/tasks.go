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

var taskSpec = tableSpec{
	name:  "tasks",
	idKey: "id",
	columns: []column{
		{"id", []string{"id", "taskid"}, kindText},
		{"title", []string{"title", "tasktitle", "taskname", "task", "name"}, kindText},
		{"service", []string{"service", "servicearea", "category", "type"}, kindText},
		{"due", []string{"due", "duedate", "deadline"}, kindDate},
		{"priority", []string{"priority"}, kindText},
		{"done", []string{"done", "completed", "iscompleted"}, kindBool},
		{"assignee", []string{"assignee", "assignedto", "assigned", "owner"}, kindText},
	},
}

var taskPriorities = []string{"low", "medium", "high", "urgent"}

// taskPatch holds the fields a client wants to change. A nil field means "leave it alone"
// (or "use the default" when creating).
type taskPatch struct {
	Title    *string `json:"title"`
	Service  *string `json:"service"`
	Due      *string `json:"due"`
	Priority *string `json:"priority"`
	Done     *bool   `json:"done"`
	Assignee *string `json:"assignee"`
}

func (p *taskPatch) empty() bool {
	return p.Title == nil && p.Service == nil && p.Due == nil && p.Priority == nil &&
		p.Done == nil && p.Assignee == nil
}

// applyDefaults is for new tasks: it requires the essentials and fills in the rest.
func (p *taskPatch) applyDefaults() error {
	if p.Title == nil || p.Due == nil {
		return errors.New("title and due are required")
	}
	if p.Priority == nil {
		pr := "medium"
		p.Priority = &pr
	}
	return nil
}

// validate checks the patch and tidies it (trimmed title, lower-case priority).
func (p *taskPatch) validate() error {
	if p.empty() {
		return errors.New("send at least one of: title, service, due, priority, done, assignee")
	}

	if p.Title != nil {
		t, err := cleanText("title", *p.Title, 120, true)
		if err != nil {
			return err
		}
		p.Title = &t
	}
	if p.Service != nil {
		s, err := cleanText("service", *p.Service, 60, false)
		if err != nil {
			return err
		}
		p.Service = &s
	}
	if p.Due != nil {
		d, err := cleanDate(*p.Due)
		if err != nil {
			return err
		}
		p.Due = &d
	}
	if p.Priority != nil {
		pr, err := cleanChoice("priority", *p.Priority, taskPriorities)
		if err != nil {
			return err
		}
		p.Priority = &pr
	}
	if p.Assignee != nil {
		a, err := cleanText("assignee", *p.Assignee, 80, false)
		if err != nil {
			return err
		}
		p.Assignee = &a
	}
	return nil
}

func (p *taskPatch) fields() map[string]any {
	f := map[string]any{}
	set := func(key string, v *string) {
		if v != nil {
			f[key] = *v
		}
	}
	set("title", p.Title)
	set("service", p.Service)
	set("due", p.Due)
	set("priority", p.Priority)
	set("assignee", p.Assignee)
	if p.Done != nil {
		f["done"] = *p.Done
	}
	return f
}

var taskIDPattern = regexp.MustCompile(`(?i)^T(\d+)$`)

// nextTaskID continues the T001, T002... sequence and never reuses an id.
func nextTaskID(existing []string) string {
	highest := 0
	taken := make(map[string]bool, len(existing))

	for _, id := range existing {
		taken[strings.ToUpper(id)] = true
		if m := taskIDPattern.FindStringSubmatch(id); m != nil {
			if n, err := strconv.Atoi(m[1]); err == nil && n > highest {
				highest = n
			}
		}
	}
	for n := highest + 1; ; n++ {
		if id := fmt.Sprintf("T%03d", n); !taken[id] {
			return id
		}
	}
}

// PATCH /api/tasks/{id}  with a JSON body such as {"done": true} or {"title": "New name"}
func (s *server) updateTask(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid task id")
		return
	}

	var patch taskPatch
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
	if err := s.tasks.Update(ctx, id, fields); err != nil {
		replyError(w, "update task", id, err)
		return
	}

	slog.Info("task updated", "id", id, "fields", fieldNames(fields), "by", emailFrom(r.Context()))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "updated": fieldNames(fields)})
}

// POST /api/tasks  needs title and due. Priority defaults to "medium".
// The server picks the id (T001, T002...) so the sheet stays the source of truth.
func (s *server) createTask(w http.ResponseWriter, r *http.Request) {
	var patch taskPatch
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

	id, err := s.tasks.Append(ctx, patch.fields(), nextTaskID)
	if err != nil {
		replyError(w, "create task", "", err)
		return
	}

	slog.Info("task created", "id", id, "by", emailFrom(r.Context()))
	writeJSON(w, http.StatusCreated, map[string]string{"id": id})
}
