package main

import "github.com/saeeddev94/filimo-plus-cli/internal/cli"

var isProduction string

func main() {
	app := cli.NewApp(isProduction == "true")
	args := cli.NewArgs(app.Name)
	if args.Build != "" {
		cli.Build(args.Build)
		return
	}
	cli.Download(app, args)
}
