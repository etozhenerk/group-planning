package architecture

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// Check scans production sources, including inactive build tags and platform files.
// Test fixtures may assemble dependencies; nested application modules are rejected.
func Check(root string) ([]string, error) {
	manifest, err := os.ReadFile(filepath.Join(root, "go.mod"))
	if err != nil {
		return nil, err
	}

	fields := strings.Fields(string(manifest))
	if len(fields) < 2 || fields[0] != "module" || fields[1] != modulePath {
		return nil, fmt.Errorf("expected backend go.mod in %s", root)
	}

	var violations []string
	count := 0
	for _, directory := range []string{"cmd", "internal"} {
		err := filepath.WalkDir(filepath.Join(root, directory), func(name string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				if os.IsNotExist(walkErr) && name == filepath.Join(root, directory) {
					return nil
				}

				return walkErr
			}

			if entry.IsDir() {
				if entry.Name() == "testdata" {
					return filepath.SkipDir
				}

				return nil
			}

			relative, err := filepath.Rel(root, name)
			if err != nil {
				return err
			}

			relative = filepath.ToSlash(relative)
			if entry.Name() == "go.mod" {
				violations = append(violations, relative+": nested application modules are not allowed")
			}

			if !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
				return nil
			}

			count++
			found, err := checkFile(name, relative)
			violations = append(violations, found...)

			return err
		})
		if err != nil {
			return nil, err
		}
	}

	if count == 0 {
		return nil, fmt.Errorf("no production Go sources in %s", root)
	}

	sort.Strings(violations)

	return violations, nil
}

func checkFile(name, relative string) ([]string, error) {
	source := boundary(path.Dir(relative))
	if source == "" {
		return []string{relative + ": unclassified package; declare its boundary first"}, nil
	}

	positions := token.NewFileSet()
	file, err := parser.ParseFile(positions, name, nil, 0)
	if err != nil {
		return nil, err
	}

	var violations []string
	report := func(position token.Pos, message string) {
		violations = append(violations, fmt.Sprintf("%s:%d: %s", relative, positions.Position(position).Line, message))
	}
	imports := map[string]string{}
	for _, spec := range file.Imports {
		imported, err := strconv.Unquote(spec.Path.Value)
		if err != nil {
			return nil, err
		}

		if !importAllowed(source, imported) {
			report(spec.Pos(), fmt.Sprintf("%s must not import %s", source, imported))
		}

		alias := path.Base(imported)
		if spec.Name != nil {
			alias = spec.Name.Name
		}

		if strings.HasPrefix(imported, modulePath+"/") {
			if alias == "." || alias == "_" {
				report(spec.Pos(), "internal imports must have an explicit usable package name")
			}

			imports[alias] = imported
		}
	}

	ast.Inspect(file, func(node ast.Node) bool {
		selector, ok := node.(*ast.SelectorExpr)
		if !ok {
			return true
		}

		qualifier, ok := selector.X.(*ast.Ident)
		if !ok || qualifier.Obj != nil {
			return true
		}

		imported, ok := imports[qualifier.Name]
		if ok && restrictedSymbol(source, imported, selector.Sel.Name) {
			report(selector.Pos(), fmt.Sprintf("%s must use application operations instead of %s.%s", source, imported, selector.Sel.Name))
		}

		return true
	})

	return violations, nil
}
