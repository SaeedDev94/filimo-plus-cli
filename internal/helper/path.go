package helper

import (
	"os"
	"path"
	"runtime"
)

func parentPath(base string, count int, current int) string {
	if count == current {
		return base
	}
	return parentPath(path.Dir(base), count, current+1)
}

func ProductionBasePath() string {
	file, _ := os.Executable()
	return parentPath(file, 1, 0)
}

func DebugBasePath() string {
	_, file, _, _ := runtime.Caller(0)
	return parentPath(file, 3, 0)
}
