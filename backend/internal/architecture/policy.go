// Package architecture checks the explicit dependency policy of the backend.
package architecture

import "strings"

const modulePath = "github.com/etozhenerk/group-planning/backend"

// Longest matching package boundary wins; an adapter is not part of its domain.
var dependencies = map[string][]string{
	"internal/meetings":         {"internal/imagecontent"},
	"internal/imagecontent":     {},
	"internal/support":          {"internal/imagecontent"},
	"internal/support/telegram": {"internal/support"},
	"internal/storage/files":    {"internal/meetings"},
	"internal/identity":         {},
	"internal/realtime":         {"internal/meetings", "internal/identity"},
	"internal/accounts":         {"internal/identity"},
	"internal/identity/yandex":  {"internal/identity"},
	"internal/storage/postgres": {"internal/meetings", "internal/identity"},
	"cmd/migrate":               {"internal/storage/postgres"},
	"internal/storage/memory":   {"internal/meetings", "internal/identity", "internal/support"},
	"internal/httpapi":          {"internal/meetings", "internal/identity", "internal/accounts", "internal/support"},
	"internal/webui":            {"internal/meetings"},
	"internal/server":           {"internal/accounts", "internal/meetings", "internal/identity", "internal/identity/yandex", "internal/storage/memory", "internal/storage/files", "internal/httpapi", "internal/webui", "internal/support", "internal/support/telegram", "internal/realtime"},
	"internal/architecture":     {},
	"cmd/server":                {"internal/meetings", "internal/server", "internal/storage/memory", "internal/storage/postgres"},
	"cmd/storage-demo":          {"internal/meetings", "internal/storage/memory"},
	"cmd/check-dependencies":    {"internal/architecture"},
}

func boundary(name string) string {
	match := ""
	for candidate := range dependencies {
		if within(name, candidate) && len(candidate) > len(match) {
			match = candidate
		}
	}

	return match
}

func within(name, parent string) bool {
	return name == parent || strings.HasPrefix(name, parent+"/")
}

func importAllowed(source, imported string) bool {
	if !strings.HasPrefix(imported, modulePath+"/") {
		if source == "internal/realtime" && imported == "github.com/centrifugal/centrifuge" {
			return true
		}

		if source == "internal/imagecontent" && within(imported, "golang.org/x/image") {
			return true
		}

		// pgx is restricted to the PostgreSQL adapter.
		if source == "internal/storage/postgres" && within(imported, "github.com/jackc/pgx/v5") {
			return true
		}

		if strings.Contains(strings.Split(imported, "/")[0], ".") || imported == "C" {
			return false
		}

		if source == "internal/meetings" || source == "internal/identity" || source == "internal/accounts" || source == "internal/support" {
			for _, blocked := range []string{"net", "net/http", "net/rpc", "database/sql", "os", "plugin"} {
				if imported == "net" || (blocked != "net" && within(imported, blocked)) {
					return false
				}
			}
		}

		return true
	}

	target := boundary(strings.TrimPrefix(imported, modulePath+"/"))
	if target == "" {
		return false
	}

	if target == source {
		return true
	}

	for _, permitted := range dependencies[source] {
		if permitted == target {
			return true
		}
	}

	return false
}

func restrictedSymbol(source, imported, symbol string) bool {
	target := strings.TrimPrefix(imported, modulePath+"/")
	if source == target || source == "internal/server" || source == "internal/storage/memory" || source == "internal/storage/postgres" || source == "cmd/storage-demo" {
		return false
	}

	switch target {
	case "internal/support":
		switch symbol {
		case "Store", "Records", "Delivery", "New":
			return true
		}
	case "internal/meetings":
		switch symbol {
		case "Store", "Reader", "Writer", "NewService", "Preview", "TransitionJob", "TransitionWorker", "NewTransitionWorker":
			return true
		}
	case "internal/identity":
		switch symbol {
		case "Store", "Records", "Provider", "New", "WithStore":
			return true
		}
	}

	return false
}
