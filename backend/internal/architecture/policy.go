// Package architecture checks the explicit dependency policy of the backend.
package architecture

import "strings"

const modulePath = "github.com/etozhenerk/group-planning/backend"

// Longest matching package boundary wins; an adapter is not part of its domain.
var dependencies = map[string][]string{
	"internal/meetings":        {},
	"internal/identity":        {},
	"internal/identity/yandex": {"internal/identity"},
	"internal/storage/memory":  {"internal/meetings", "internal/identity"},
	"internal/httpapi":         {"internal/meetings", "internal/identity"},
	"internal/webui":           {"internal/meetings"},
	"internal/server":          {"internal/meetings", "internal/identity", "internal/identity/yandex", "internal/storage/memory", "internal/httpapi", "internal/webui"},
	"internal/architecture":    {},
	"cmd/server":               {"internal/server", "internal/storage/memory"},
	"cmd/storage-demo":         {"internal/meetings", "internal/storage/memory"},
	"cmd/check-dependencies":   {"internal/architecture"},
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
		// Third-party dependencies require an explicit policy decision.
		if strings.Contains(strings.Split(imported, "/")[0], ".") || imported == "C" {
			return false
		}

		if source == "internal/meetings" || source == "internal/identity" {
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
	if source == target || source == "internal/server" || source == "internal/storage/memory" || source == "cmd/storage-demo" {
		return false
	}

	switch target {
	case "internal/meetings":
		switch symbol {
		case "Store", "Reader", "Writer", "NewService", "Preview", "TransitionJob", "TransitionWorker", "NewTransitionWorker":
			return true
		}
	case "internal/identity":
		switch symbol {
		case "Store", "Records", "Provider", "New":
			return true
		}
	}

	return false
}
