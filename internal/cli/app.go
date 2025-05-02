package cli

import (
	"fmt"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type App struct {
	Name     string
	Author   string
	Version  string
	BasePath string
}

func (app App) PrintVersion() {
	fmt.Println(app.Name, app.Version)
}

func (app App) PrintAuthor() {
	fmt.Println("Author:", app.Author)
}

func NewApp(isProduction bool) App {
	var basePath string
	if isProduction {
		basePath = helper.ProductionBasePath()
	} else {
		basePath = helper.DebugBasePath()
	}
	return App{
		Name:     "filimo-plus-cli",
		Author:   "SaeedDev94",
		Version:  "v6.4.0",
		BasePath: basePath,
	}
}
