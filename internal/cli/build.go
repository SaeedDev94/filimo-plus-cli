package cli

import (
	"fmt"
	"os"
	"path"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
	"github.com/saeeddev94/filimo-plus-cli/internal/stream"
)

type BuildOption struct {
	Name string
	Path string
}

func Build(input string, output string) {
	builder := stream.Builder{
		Input:  input,
		Output: output,
	}

	videoDir := stream.VideoDir(input)
	audioDir := stream.AudioDir(input)
	subtitleDir := stream.SubtitleDir(input)

	var videoOptions []BuildOption
	var audioOptions []BuildOption
	var subtitleOptions []BuildOption

	if !helper.IsFileExists(videoDir) {
		panic(fmt.Sprintf("%s not found", videoDir))
	}

	videoOptions = getOptions(videoDir, true)
	if len(videoOptions) == 0 {
		panic("There is no video options")
	}

	if helper.IsFileExists(audioDir) {
		audioOptions = getOptions(audioDir, true)
	}

	if helper.IsFileExists(subtitleDir) {
		subtitleOptions = getOptions(subtitleDir, false)
	}

	if len(videoOptions) > 0 {
		selected := ask(VIDEO_STEP, videoOptions)
		if len(selected) != 1 {
			panic("You must select exactly one video")
		}
		paths := getPaths(selected, videoOptions)
		builder.Video = paths[0]
	}

	if len(audioOptions) > 0 {
		selected := ask(AUDIO_STEP, audioOptions)
		builder.Audio = getPaths(selected, audioOptions)
	}

	if len(subtitleOptions) > 0 {
		selected := ask(SUBTITLE_STEP, subtitleOptions)
		builder.Subtitle = getPaths(selected, subtitleOptions)
	}

	builder.Build()
}

func getOptions(base string, isPlaylist bool) []BuildOption {
	options := []BuildOption{}
	entries, err := os.ReadDir(base)
	if err != nil {
		panic(err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dirName := entry.Name()
		dirPath := path.Join(base, dirName)
		var filePath string
		if isPlaylist {
			filePath = stream.PlaylistFile(dirPath)
		} else {
			filePath = stream.SrtFile(dirPath)
		}
		if !helper.IsFileExists(filePath) {
			panic(fmt.Sprintf("%s not found", filePath))
		}
		option := BuildOption{
			Name: dirName,
			Path: dirPath,
		}
		options = append(options, option)
	}
	return options
}

func getPaths(selected []int, options []BuildOption) []string {
	items := []string{}
	for _, item := range selected {
		items = append(items, options[item].Path)
	}
	return items
}

func ask(label string, options []BuildOption) []int {
	items := []string{}
	for _, option := range options {
		items = append(items, option.Name)
	}
	return helper.Question(label, items)
}
