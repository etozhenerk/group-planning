package webui

import (
	"bytes"
	"errors"
	"html/template"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type metadata struct{ Title, Description, URL, Image string }

var metadataHead = template.Must(template.New("metadata").Parse(`
<title>{{.Title}} — Somewhere</title>
<meta name="description" content="{{.Description}}">
<link rel="canonical" href="{{.URL}}">
<meta property="og:title" content="{{.Title}}">
<meta property="og:description" content="{{.Description}}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{.URL}}">
<meta property="og:site_name" content="Somewhere">
<meta property="og:locale" content="ru_RU">
<meta property="og:image" content="{{.Image}}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Somewhere — встречи с друзьями">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{.Title}}">
<meta name="twitter:description" content="{{.Description}}">
<meta name="twitter:image" content="{{.Image}}">
`))

var (
	defaultTitle       = regexp.MustCompile(`(?is)<title>.*?</title>`)
	defaultDescription = regexp.MustCompile(`(?is)<meta\s+name=["']description["'][^>]*>`)
)

func (h *handler) invitation(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-Robots-Tag", "noindex, nofollow")
	token, legacy := strings.CutPrefix(r.URL.Path, "/invitations/")
	if !legacy {
		token = strings.TrimPrefix(r.URL.Path, "/i/")
	}

	preview, err := meetings.Preview(r.Context(), h.store, token)
	if err != nil {
		status := http.StatusServiceUnavailable
		if errors.Is(err, meetings.ErrNotFound) {
			status = http.StatusNotFound
		}

		h.page(w, r, status, nil)

		return
	}

	if legacy {
		target := "/i/" + token
		if r.URL.RawQuery != "" {
			target += "?" + r.URL.RawQuery
		}

		http.Redirect(w, r, target, http.StatusPermanentRedirect)

		return
	}

	values := metadata{Title: preview.Title, Description: description(preview), URL: h.origin + "/i/" + token, Image: h.origin + "/share-card.png"}
	h.page(w, r, http.StatusOK, &values)
}

func description(preview meetings.PublicInvitation) string {
	if text := strings.TrimSpace(preview.Description); text != "" {
		return strings.Join(strings.Fields(text), " ")
	}

	parts := []string{}
	if preview.StartsAt != nil {
		location, err := time.LoadLocation(preview.Timezone)
		if err != nil {
			location = time.UTC
		}

		parts = append(parts, preview.StartsAt.In(location).Format("02.01.2006 в 15:04"))
	}

	if preview.Place != "" {
		parts = append(parts, preview.Place)
	}

	if len(parts) == 0 {
		return "Вас приглашают на встречу в Somewhere."
	}

	return strings.Join(parts, " · ")
}

func (h *handler) page(w http.ResponseWriter, r *http.Request, status int, values *metadata) {
	data, err := os.ReadFile(filepath.Join(h.directory, "index.html"))
	if err != nil {
		http.Error(w, "page unavailable", http.StatusServiceUnavailable)
		return
	}

	if values != nil {
		var head bytes.Buffer
		if err := metadataHead.Execute(&head, values); err != nil {
			http.Error(w, "page unavailable", http.StatusServiceUnavailable)
			return
		}

		base := defaultTitle.ReplaceAllString(string(data), "")
		base = defaultDescription.ReplaceAllString(base, "")
		if !strings.Contains(base, "</head>") {
			http.Error(w, "page unavailable", http.StatusServiceUnavailable)
			return
		}

		data = []byte(strings.Replace(base, "</head>", head.String()+"</head>", 1))
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.WriteHeader(status)
	if r.Method != http.MethodHead {
		_, _ = w.Write(data)
	}
}
