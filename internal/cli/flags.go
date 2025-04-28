package cli

import "flag"

type Flag struct {
	ShortName string
	FullName  string
	Usage     string
	Register  func(flag *Flag)
}

func GetFlags(flagSet *flag.FlagSet, args *Args) []Flag {
	return []Flag{
		{
			ShortName: "i",
			FullName:  "id",
			Usage:     "<string> Item ID",
			Register: func(flag *Flag) {
				flagSet.StringVar(&args.Id, flag.ShortName, args.Id, flag.Usage)
				flagSet.StringVar(&args.Id, flag.FullName, args.Id, flag.Usage)
			},
		},
		{
			ShortName: "t",
			FullName:  "token",
			Usage:     "<string> Token value",
			Register: func(flag *Flag) {
				flagSet.StringVar(&args.Token, flag.ShortName, args.Token, flag.Usage)
				flagSet.StringVar(&args.Token, flag.FullName, args.Token, flag.Usage)
			},
		},
		{
			ShortName: "b",
			FullName:  "build",
			Usage:     "<string> build downloaded item",
			Register: func(flag *Flag) {
				flagSet.StringVar(&args.Build, flag.ShortName, args.Build, flag.Usage)
				flagSet.StringVar(&args.Build, flag.FullName, args.Build, flag.Usage)
			},
		},
		{
			ShortName: "o",
			FullName:  "output",
			Usage:     "<string> output build directory",
			Register: func(flag *Flag) {
				flagSet.StringVar(&args.Output, flag.ShortName, args.Output, flag.Usage)
				flagSet.StringVar(&args.Output, flag.FullName, args.Output, flag.Usage)
			},
		},
		{
			ShortName: "a",
			FullName:  "author",
			Usage:     "Print author name",
			Register: func(flag *Flag) {
				flagSet.BoolVar(&args.Author, flag.ShortName, args.Author, flag.Usage)
				flagSet.BoolVar(&args.Author, flag.FullName, args.Author, flag.Usage)
			},
		},
		{
			ShortName: "v",
			FullName:  "version",
			Usage:     "Print app version",
			Register: func(flag *Flag) {
				flagSet.BoolVar(&args.Version, flag.ShortName, args.Version, flag.Usage)
				flagSet.BoolVar(&args.Version, flag.FullName, args.Version, flag.Usage)
			},
		},
		{
			ShortName: "h",
			FullName:  "help",
			Usage:     "Print this help",
			Register: func(flag *Flag) {
				flagSet.BoolVar(&args.Help, flag.ShortName, args.Help, flag.Usage)
				flagSet.BoolVar(&args.Help, flag.FullName, args.Help, flag.Usage)
			},
		},
	}
}
