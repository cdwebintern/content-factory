package main

import (
	"context"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"google.golang.org/api/idtoken"
)

func newRouter(cfg config, s *server, auth authenticator) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Handle("PATCH /api/tasks/{id}", auth.wrap(http.HandlerFunc(s.updateTask)))
	mux.Handle("PATCH /api/meetings/{id}", auth.wrap(http.HandlerFunc(s.updateMeeting)))
	mux.Handle("POST /api/meetings", auth.wrap(http.HandlerFunc(s.createMeeting)))

	return logRequests(cors(cfg.AllowedOrigins, mux))
}

// ---- authentication -------------------------------------------------------

type authenticator interface {
	wrap(next http.Handler) http.Handler
}

func newAuthenticator(cfg config) authenticator {
	if cfg.AuthMode == "google" {
		return googleAuth{clientID: cfg.GoogleClientID, allowed: cfg.AllowedEmails}
	}
	return noAuth{}
}

// noAuth lets everything through. Only for local development: config refuses it in production.
type noAuth struct{}

func (noAuth) wrap(next http.Handler) http.Handler { return next }

// googleAuth expects "Authorization: Bearer <Google ID token>" and only lets
// verified accounts from the allow-list through.
type googleAuth struct {
	clientID string
	allowed  map[string]bool
}

type ctxKey string

const emailKey ctxKey = "email"

func emailFrom(ctx context.Context) string {
	if email, ok := ctx.Value(emailKey).(string); ok {
		return email
	}
	return "anonymous (AUTH_MODE=none)"
}

func (a googleAuth) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || token == "" {
			writeError(w, http.StatusUnauthorized, "sign in required")
			return
		}

		payload, err := idtoken.Validate(r.Context(), token, a.clientID)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid or expired sign-in")
			return
		}

		email, _ := payload.Claims["email"].(string)
		verified, _ := payload.Claims["email_verified"].(bool)
		if !verified || !a.allowed[strings.ToLower(email)] {
			writeError(w, http.StatusForbidden, "this account is not allowed to edit tasks")
			return
		}

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), emailKey, email)))
	})
}

// ---- CORS and logging -----------------------------------------------------

// cors lets only the listed web pages call the API from a browser.
// It does not stop other programs, which is why authentication matters too.
func cors(allowed []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && slices.Contains(allowed, origin) {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", origin)
			h.Set("Vary", "Origin")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			h.Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions { // the browser's preflight check
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", sw.status,
			"took", time.Since(start).Round(time.Millisecond),
		)
	})
}
