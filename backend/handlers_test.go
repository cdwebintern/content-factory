package main

import "testing"

func ptr[T any](v T) *T { return &v }

func TestPatchValidate(t *testing.T) {
	tests := []struct {
		name    string
		patch   taskPatch
		wantErr bool
	}{
		{"empty patch", taskPatch{}, true},
		{"done only", taskPatch{Done: ptr(true)}, false},
		{"blank title", taskPatch{Title: ptr("   ")}, true},
		{"title with newline", taskPatch{Title: ptr("a\nb")}, true},
		{"good title", taskPatch{Title: ptr("  Send report  ")}, false},
		{"bad date format", taskPatch{Due: ptr("25/11/2026")}, true},
		{"impossible date", taskPatch{Due: ptr("2026-02-31")}, true},
		{"good date", taskPatch{Due: ptr("2026-11-25")}, false},
		{"unknown priority", taskPatch{Priority: ptr("critical")}, true},
		{"priority is normalised", taskPatch{Priority: ptr("HIGH")}, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.patch.validate()
			if (err != nil) != tc.wantErr {
				t.Errorf("validate() error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}

func TestPatchValidateCleansInput(t *testing.T) {
	p := taskPatch{Title: ptr("  Send report  "), Priority: ptr("HIGH")}
	if err := p.validate(); err != nil {
		t.Fatal(err)
	}
	if *p.Title != "Send report" {
		t.Errorf("title = %q, want %q", *p.Title, "Send report")
	}
	if *p.Priority != "high" {
		t.Errorf("priority = %q, want %q", *p.Priority, "high")
	}
}

func TestFindColumns(t *testing.T) {
	cols := findColumns([]any{"Task ID", "Task Title", "Due_Date", "Priority", "Completed"})
	want := map[string]int{"id": 0, "title": 1, "due": 2, "priority": 3, "done": 4}

	for field, index := range want {
		if got, ok := cols[field]; !ok || got != index {
			t.Errorf("column %q = %d (found %v), want %d", field, got, ok, index)
		}
	}
}
