package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"
)

var taskSpec = tableSpec{
	name:  "tasks",
	idKey: "id",
	columns: []column{
		{"id", []string{"id", "taskid"}, kindText},
		{"title", []string{"title", "tasktitle", "taskname", "task", "name"}, kindText},
		{"due", []string{"due", "duedate", "deadline"}, kindDate},
		{"priority", []string{"priority"}, kindText},
		{"done", []string{"done", "completed", "iscompleted"}, kindBool},
	},
}

var taskPriorities = []string{"low", "medium", "high", "urgent"}

// taskPatch holds the fields a client wants to change. A nil field means "leave it alone".
type taskPatch struct {
	Title    *string `json:"title"`
	Due      *string `json:"due"`
	Priority *string `json:"priority"`
	Done     *bool   `json:"done"`
}

// validate checks the patch and tidies it (trimmed title, lower-case priority).
func (p *taskPatch) validate() error {
	if p.Title == nil && p.Due == nil && p.Priority == nil && p.Done == nil {
		return errors.New("send at least one of: title, due, priority, done")
	}

	if p.Title != nil {
		t, err := cleanText("title", *p.Title, 120, true)
		if err != nil {
			return err
		}
		p.Title = &t
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
	return nil
}

func (p *taskPatch) fields() map[string]any {
	f := map[string]any{}
	if p.Title != nil {
		f["title"] = *p.Title
	}
	if p.Due != nil {
		f["due"] = *p.Due
	}
	if p.Priority != nil {
		f["priority"] = *p.Priority
	}
	if p.Done != nil {
		f["done"] = *p.Done
	}
	return f
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
