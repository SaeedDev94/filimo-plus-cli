package helper

import (
	"os"
	"path/filepath"
)

func MakeDirectories(path string) {
	if path == "." || IsFileExists(path) {
		return
	}
	if err := os.MkdirAll(path, 0755); err != nil {
		panic(err)
	}
}

func CreateFile(path string) *os.File {
	MakeDirectories(filepath.Dir(path))
	file, err := os.Create(path)
	if err != nil {
		panic(file)
	}
	return file
}

func IsFileExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true
	}
	if os.IsNotExist(err) {
		return false
	}
	panic(err)
}

func ReadFile(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return string(data)
}

func WriteFile(path string, content string) {
	file := CreateFile(path)
	defer file.Close()
	if _, err := file.WriteString(content); err != nil {
		panic(err)
	}
}

func DeleteFile(path string) {
	if err := os.Remove(path); err != nil {
		panic(err)
	}
}
