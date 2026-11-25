package main

import "testing"

func ptr[T any](v T) *T { return &v }

func TestTaskPatchValidate(t *testing.T) {
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

func TestTaskPatchCleansInput(t *testing.T) {
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

func TestMeetingPatchValidate(t *testing.T) {
	tests := []struct {
		name    string
		patch   meetingPatch
		wantErr bool
	}{
		{"empty", meetingPatch{}, true},
		{"title only", meetingPatch{Title: ptr("Weekly sync")}, false},
		{"blank title", meetingPatch{Title: ptr(" ")}, true},
		{"bad date", meetingPatch{Date: ptr("24-11-2026")}, true},
		{"bad time", meetingPatch{Start: ptr("25:00")}, true},
		{"end before start", meetingPatch{Start: ptr("11:00"), End: ptr("10:30")}, true},
		{"end equals start", meetingPatch{Start: ptr("10:00"), End: ptr("10:00")}, true},
		{"good times", meetingPatch{Start: ptr("10:00"), End: ptr("10:45")}, false},
		{"javascript link", meetingPatch{Link: ptr("javascript:alert(1)")}, true},
		{"link without scheme", meetingPatch{Link: ptr("zoom.us/j/123")}, true},
		{"good link", meetingPatch{Link: ptr("https://zoom.us/j/12345678901")}, false},
		{"empty link clears it", meetingPatch{Link: ptr("")}, false},
		{"unknown status", meetingPatch{Status: ptr("postponed")}, true},
		{"unknown priority", meetingPatch{Priority: ptr("urgent")}, true},
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

func TestMeetingFieldsUseSheetStyle(t *testing.T) {
	p := meetingPatch{Status: ptr("completed"), Priority: ptr("high")}
	if err := p.validate(); err != nil {
		t.Fatal(err)
	}
	f := p.fields()
	if f["status"] != "Completed" || f["priority"] != "High" {
		t.Errorf("fields = %v, want Completed and High", f)
	}
}

func TestMeetingApplyDefaults(t *testing.T) {
	missing := meetingPatch{Title: ptr("Sync")}
	if err := missing.applyDefaults(); err == nil {
		t.Error("expected an error when date, start and end are missing")
	}

	p := meetingPatch{Title: ptr("Sync"), Date: ptr("2026-12-02"), Start: ptr("09:00"), End: ptr("09:30")}
	if err := p.applyDefaults(); err != nil {
		t.Fatal(err)
	}
	if err := p.validate(); err != nil {
		t.Fatal(err)
	}
	if *p.Status != "scheduled" || *p.Priority != "medium" {
		t.Errorf("defaults = %q and %q, want scheduled and medium", *p.Status, *p.Priority)
	}
}

func TestNextMeetingID(t *testing.T) {
	tests := []struct {
		name     string
		existing []string
		want     string
	}{
		{"no meetings yet", nil, "M001"},
		{"continues the sequence", []string{"M001", "M002", "M010"}, "M011"},
		{"ignores other ids", []string{"x", "t5", "M003"}, "M004"},
		{"is case-insensitive", []string{"m007"}, "M008"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := nextMeetingID(tc.existing); got != tc.want {
				t.Errorf("nextMeetingID() = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestEncodeValue(t *testing.T) {
	// Columns that hold real dates and times get real dates and times (serial numbers)
	if got, err := encodeValue(kindDate, "2026-11-24", 46000.0); err != nil || got != 46350.0 {
		t.Errorf("date as number = %v, %v; want 46350", got, err)
	}
	if got, err := encodeValue(kindTime, "10:30", 0.4); err != nil || got != 0.4375 {
		t.Errorf("time as number = %v, %v; want 0.4375", got, err)
	}

	// Columns that hold text keep getting text
	if got, err := encodeValue(kindDate, "2026-11-24", "2026-11-23"); err != nil || got != "2026-11-24" {
		t.Errorf("date as text = %v, %v", got, err)
	}
	if got, err := encodeValue(kindTime, "10:30", nil); err != nil || got != "10:30" {
		t.Errorf("time as text = %v, %v", got, err)
	}
}

func TestNormalizeHeader(t *testing.T) {
	tests := map[string]string{
		"meeting _title": "meetingtitle",
		"Due_Date":       "duedate",
		"Task ID":        "taskid",
	}
	for in, want := range tests {
		if got := normalizeHeader(in); got != want {
			t.Errorf("normalizeHeader(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestCleanLink(t *testing.T) {
	good := []string{"https://zoom.us/j/123", "http://example.com/a?b=c", ""}
	bad := []string{"zoom.us/j/123", "ftp://example.com", "javascript:alert(1)", "https://"}

	for _, s := range good {
		if _, err := cleanLink(s); err != nil {
			t.Errorf("cleanLink(%q) unexpected error: %v", s, err)
		}
	}
	for _, s := range bad {
		if _, err := cleanLink(s); err == nil {
			t.Errorf("cleanLink(%q) should be rejected", s)
		}
	}
}
