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

type metadata struct {
	Title, PageTitle, Description, URL, Image, ImageType, ImageAlt string
	ImageWidth, ImageHeight                                        int
}

var metadataHead = template.Must(template.New("metadata").Parse(`
<title>{{.PageTitle}}</title>
<meta name="description" content="{{.Description}}">
<link rel="canonical" href="{{.URL}}">
<meta property="og:title" content="{{.Title}}">
<meta property="og:description" content="{{.Description}}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{.URL}}">
<meta property="og:site_name" content="somewhere">
<meta property="og:locale" content="ru_RU">
<meta property="og:image" content="{{.Image}}">
<meta property="og:image:secure_url" content="{{.Image}}">
<meta property="og:image:type" content="{{.ImageType}}">
<meta property="og:image:width" content="{{.ImageWidth}}">
<meta property="og:image:height" content="{{.ImageHeight}}">
<meta property="og:image:alt" content="{{.ImageAlt}}">
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

	preview, err := h.invitations.PublicPreview(r.Context(), token)
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

	values := h.defaultMetadata()
	values.Title = preview.Title
	values.PageTitle = preview.Title + " — somewhere"
	values.Description = description(preview)
	values.URL = h.origin + "/i/" + token
	if preview.CoverVersion != "" {
		cover, err := h.invitations.ReadInvitationCover(r.Context(), token, preview.CoverVersion)
		if err == nil {
			values.Image = h.origin + "/api/v1/invitations/" + token + "/cover?v=" + preview.CoverVersion
			values.ImageType = cover.MediaType
			values.ImageWidth = cover.Width
			values.ImageHeight = cover.Height
			values.ImageAlt = preview.Title
		}
	}

	h.page(w, r, http.StatusOK, &values)
}

func (h *handler) defaultMetadata() metadata {
	return metadata{
		Title:       "somewhere — встречи с друзьями",
		PageTitle:   "somewhere — встречи с друзьями",
		Description: "Пригласите друзей на встречу. Ответы, детали и общий разговор — в somewhere.",
		URL:         h.origin + "/",
		Image:       h.origin + "/share-card.png",
		ImageType:   "image/png",
		ImageAlt:    "somewhere — встречи с друзьями",
		ImageWidth:  1200,
		ImageHeight: 630,
	}
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
	} else if day, err := time.Parse(time.DateOnly, preview.StartsOn); err == nil {
		parts = append(parts, day.Format("02.01.2006")+" · время уточняется")
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
