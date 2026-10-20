// Package webui serves the built client and public invitation metadata.
package webui

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type handler struct {
	directory string
	origin    string
	store     meetings.Store
	static    http.Handler
}

// New serves a prebuilt client. The trusted HTTPS origin supplies canonical URLs.
// It does not enable authentication or seed any meetings.
func New(store meetings.Store, directory, origin string) (http.Handler, error) {
	address, err := url.Parse(origin)
	if err != nil || address.Scheme != "https" || address.Hostname() == "" || address.User != nil || address.Path != "" || address.RawQuery != "" || address.Fragment != "" || address.ForceQuery || origin != "https://"+address.Host {
		return nil, fmt.Errorf("web origin must be an HTTPS origin without credentials, path, query or fragment")
	}

	directory, err = filepath.Abs(directory)
	if err != nil {
		return nil, fmt.Errorf("resolve web directory: %w", err)
	}

	if data, err := os.ReadFile(filepath.Join(directory, "index.html")); err != nil || !strings.Contains(string(data), "</head>") {
		return nil, fmt.Errorf("web directory must contain a built index.html with a head element")
	}

	return &handler{directory: directory, origin: origin, store: store, static: http.FileServer(http.Dir(directory))}, nil
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)

		return
	}

	if r.URL.Path != path.Clean(r.URL.Path) {
		http.NotFound(w, r)
		return
	}

	if strings.HasPrefix(r.URL.Path, "/i/") || strings.HasPrefix(r.URL.Path, "/invitations/") {
		h.invitation(w, r)
		return
	}

	target := filepath.Join(h.directory, strings.TrimPrefix(r.URL.Path, "/"))
	if info, err := os.Stat(target); err == nil && info.Mode().IsRegular() {
		h.static.ServeHTTP(w, r)
		return
	}

	if strings.HasPrefix(r.URL.Path, "/assets/") || path.Ext(r.URL.Path) != "" {
		http.NotFound(w, r)
		return
	}

	h.page(w, r, http.StatusOK, nil)
}
