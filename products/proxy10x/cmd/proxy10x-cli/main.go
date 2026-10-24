package main

import (
	"os"

	"github.com/bwalia/tenthmatrix/products/proxy10x/internal/cli"
)

// Injected via -ldflags at build time.
var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	os.Exit(cli.Execute(version, commit, date))
}
