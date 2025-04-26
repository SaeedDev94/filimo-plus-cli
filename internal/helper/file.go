package helper

import (
	"os"
	"path/filepath"
)

func makeDirectories(path string) {
	dir := filepath.Dir(path)
	if dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			panic(err)
		}
	}
}

func CreateFile(path string) *os.File {
	makeDirectories(path)
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
