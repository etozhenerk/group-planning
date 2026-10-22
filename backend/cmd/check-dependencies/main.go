// Command check-dependencies validates the backend module boundaries.
package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/etozhenerk/group-planning/backend/internal/architecture"
)

func main() {
	root := flag.String("root", ".", "backend module directory")
	flag.Parse()
	violations, err := architecture.Check(*root)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	for _, violation := range violations {
		fmt.Fprintln(os.Stderr, violation)
	}

	if len(violations) != 0 {
		os.Exit(1)
	}

	fmt.Println("Backend dependency boundaries OK")
}
