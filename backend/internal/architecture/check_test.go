package architecture

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDependencyPolicy(t *testing.T) {
	tests := []struct {
		name, source, dependency string
		allowed                  bool
	}{
		{"transport to operations", "internal/httpapi", modulePath + "/internal/meetings", true},
		{"transport to account operation", "internal/httpapi", modulePath + "/internal/accounts", true},
		{"account to identity operation", "internal/accounts", modulePath + "/internal/identity", true},
		{"account to storage", "internal/accounts", modulePath + "/internal/storage/memory", false},
		{"account to HTTP", "internal/accounts", "net/http", false},
		{"transport to storage", "internal/httpapi", modulePath + "/internal/storage/memory", false},
		{"transport to provider", "internal/httpapi", modulePath + "/internal/identity/yandex", false},
		{"domain to HTTP", "internal/meetings", "net/http", false},
		{"domain to SQL", "internal/meetings", "database/sql", false},
		{"domain to transport", "internal/meetings", modulePath + "/internal/httpapi", false},
		{"domain to storage", "internal/identity", modulePath + "/internal/storage/memory", false},
		{"domain to its adapter", "internal/identity", modulePath + "/internal/identity/yandex", false},
		{"domain to another domain", "internal/identity", modulePath + "/internal/meetings", false},
		{"domain URL validation", "internal/identity", "net/url", true},
		{"adapter to owner", "internal/identity/yandex", modulePath + "/internal/identity", true},
		{"composition to transport", "internal/server", modulePath + "/internal/httpapi", true},
		{"composition to provider", "internal/server", modulePath + "/internal/identity/yandex", true},
		{"unknown module", "internal/httpapi", modulePath + "/internal/future", false},
		{"similar package prefix", "internal/httpapi", modulePath + "/internal/meetingsother", false},
		{"unreviewed SDK", "internal/meetings", "example.com/provider", false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if actual := importAllowed(test.source, test.dependency); actual != test.allowed {
				t.Fatalf("allowed = %v, want %v", actual, test.allowed)
			}
		})
	}
}

func TestSourceChecks(t *testing.T) {
	tests := []struct{ name, file, source, problem string }{
		{"allowed", "internal/httpapi/example.go", `package httpapi
import m "MODULE/internal/meetings"
var app *m.Service`, ""},
		{"account cannot access records", "internal/accounts/example.go", `package accounts
import "MODULE/internal/identity"
var records identity.Records`, "application operations"},
		{"storage alias", "internal/httpapi/example.go", `package httpapi
import m "MODULE/internal/meetings"
type Store = m.Store`, "application operations"},
		{"constructor alias", "internal/httpapi/example.go", `package httpapi
import m "MODULE/internal/meetings"
var build = m.NewService`, "application operations"},
		{"public preview bypass", "internal/webui/example.go", `package webui
import "MODULE/internal/meetings"
var preview = meetings.Preview`, "application operations"},
		{"identity storage", "internal/httpapi/example.go", `package httpapi
import "MODULE/internal/identity"
var records identity.Records`, "application operations"},
		{"worker wiring in transport", "internal/httpapi/example.go", `package httpapi
import m "MODULE/internal/meetings"
var build = m.NewTransitionWorker`, "application operations"},
		{"queue record in transport", "internal/httpapi/example.go", `package httpapi
import m "MODULE/internal/meetings"
var job m.TransitionJob`, "application operations"},
		{"dot import", "internal/httpapi/example.go", `package httpapi
import . "MODULE/internal/meetings"
var app *Service`, "explicit usable package name"},
		{"blank import", "internal/httpapi/example.go", `package httpapi
import _ "MODULE/internal/meetings"`, "explicit usable package name"},
		{"inactive build tag", "internal/meetings/example_windows.go", `//go:build windows

package meetings
import _ "net/http"`, "must not import"},
		{"unknown package", "internal/future/example.go", `package future`, "unclassified package"},
		{"shadowed qualifier", "internal/httpapi/example.go", `package httpapi
import "MODULE/internal/meetings"
var app *meetings.Service
func example() { meetings := struct{ Store int }{}; _ = meetings.Store }`, ""},
		{"test wiring", "internal/httpapi/example_test.go", `package httpapi
import "MODULE/internal/storage/memory"
var store = memory.New()`, ""},
		{"testdata", "internal/meetings/testdata/example.go", `package meetings
import _ "net/http"`, ""},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			root := moduleFixture(t)
			writeFixture(t, root, test.file, strings.ReplaceAll(test.source, "MODULE", modulePath))
			problems, err := Check(root)
			if err != nil {
				t.Fatal(err)
			}

			joined := strings.Join(problems, "\n")
			if test.problem == "" && len(problems) != 0 || test.problem != "" && !strings.Contains(joined, test.problem) {
				t.Fatalf("problems = %q, want %q", joined, test.problem)
			}
		})
	}
}

func TestInvalidSourceAndRoot(t *testing.T) {
	t.Run("parse error", func(t *testing.T) {
		root := moduleFixture(t)
		writeFixture(t, root, "internal/identity/broken.go", "not valid Go")
		if _, err := Check(root); err == nil {
			t.Fatal("invalid source was accepted")
		}
	})
	t.Run("wrong root", func(t *testing.T) {
		if _, err := Check(t.TempDir()); err == nil {
			t.Fatal("missing module was accepted")
		}
	})
	t.Run("nested module", func(t *testing.T) {
		root := moduleFixture(t)
		writeFixture(t, root, "internal/identity/go.mod", "module hidden")
		problems, err := Check(root)
		if err != nil || len(problems) != 1 || !strings.Contains(problems[0], "nested application modules") {
			t.Fatalf("problems=%v err=%v", problems, err)
		}
	})
}

func moduleFixture(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeFixture(t, root, "go.mod", "module "+modulePath+"\n")
	writeFixture(t, root, "internal/meetings/base.go", "package meetings\n")

	return root
}

func writeFixture(t *testing.T, root, name, content string) {
	t.Helper()
	target := filepath.Join(root, filepath.FromSlash(name))
	if err := os.MkdirAll(filepath.Dir(target), 0o700); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(target, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
}

func TestRepositoryBoundaries(t *testing.T) {
	problems, err := Check(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}

	if len(problems) != 0 {
		t.Fatal(strings.Join(problems, "\n"))
	}
}
