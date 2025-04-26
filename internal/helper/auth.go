package helper

import (
	"path"
	"strings"
)

type AuthToken struct {
	Path      string
	FlagValue string
}

func (authToken AuthToken) Get() string {
	if authToken.FlagValue != "" {
		return authToken.FlagValue
	}
	if !IsFileExists(authToken.Path) {
		return ""
	}
	return strings.TrimSpace(ReadFile(authToken.Path))
}

func (authToken AuthToken) Set(value string) {
	WriteFile(authToken.Path, value)
}

func (authToken AuthToken) Delete() {
	if !IsFileExists(authToken.Path) {
		return
	}
	DeleteFile(authToken.Path)
}

func TokenPath(basePath string) string {
	return path.Join(basePath, "token")
}

func GetUserAgent() string {
	userAgent := "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
	return userAgent
}
