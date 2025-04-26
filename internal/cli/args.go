package cli

import (
	"flag"
	"fmt"
	"os"
)

type Args struct {
	appName  string
	Id       string
	Token    string
	Build    string
	Author   bool
	Version  bool
	Help     bool
}

func (args Args) PrintHelp() {
	fmt.Println("Usage:", args.appName, "[OPTIONS]")
	for _, flag := range GetFlags(nil, nil) {
		fmt.Printf("-%s, -%s: %s\n", flag.ShortName, flag.FullName, flag.Usage)
	}
}

func NewArgs(appName string) Args {
	args := Args{appName: appName}
	flagSet := flag.NewFlagSet(args.appName, flag.ExitOnError)
	for _, flag := range GetFlags(flagSet, &args) {
		flag.Register(&flag)
	}
	flagSet.Usage = func() {
		args.PrintHelp()
	}
	flagSet.Parse(os.Args[1:])
	return args
}
