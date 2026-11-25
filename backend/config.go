package main

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

type config struct {
	Port           string
	AppEnv         string
	SheetID        string
	TasksTab       string
	MeetingsTab    string
	AllowedOrigins []string
	AuthMode       string // "none" for local development, "google" for real use
	GoogleClientID string
	AllowedEmails  map[string]bool
}

func loadConfig() (config, error) {
	cfg := config{
		Port:           getenv("PORT", "8080"),
		AppEnv:         getenv("APP_ENV", "development"),
		SheetID:        os.Getenv("SHEET_ID"),
		TasksTab:       getenv("TASKS_TAB", "Tasks"),
		MeetingsTab:    getenv("MEETINGS_TAB", "Meetings"),
		AllowedOrigins: splitList(getenv("ALLOWED_ORIGINS", "http://localhost:5173")),
		AuthMode:       getenv("AUTH_MODE", "none"),
		GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
		AllowedEmails:  map[string]bool{},
	}
	for _, email := range splitList(os.Getenv("ALLOWED_EMAILS")) {
		cfg.AllowedEmails[strings.ToLower(email)] = true
	}

	if cfg.SheetID == "" {
		return cfg, errors.New("SHEET_ID is required")
	}

	switch cfg.AuthMode {
	case "none":
		// Anyone who can reach the server could edit the sheet, so never in production
		if cfg.AppEnv == "production" {
			return cfg, errors.New("AUTH_MODE=none is not allowed when APP_ENV=production")
		}
	case "google":
		if cfg.GoogleClientID == "" || len(cfg.AllowedEmails) == 0 {
			return cfg, errors.New("AUTH_MODE=google needs GOOGLE_CLIENT_ID and ALLOWED_EMAILS")
		}
	default:
		return cfg, fmt.Errorf("AUTH_MODE must be \"none\" or \"google\", got %q", cfg.AuthMode)
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

// splitList turns "a, b ,c" into ["a" "b" "c"], dropping empty entries.
func splitList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}

// loadDotEnv reads KEY=VALUE lines from a file for local development.
// Variables that are already set in the environment win.
func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return // no .env file is fine, e.g. in production
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}
}
