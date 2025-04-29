package stream

import (
	"fmt"
	"os"
	"os/exec"
	"path"
	"strings"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Builder struct {
	directory string
	Input     string
	Output    string
	Video     string
	Audio     []string
	Subtitle  []string
}

func (builder *Builder) outputFile(dir string) string {
	fileExtension := ".mp4"
	fileName := path.Base(dir)
	if fileName == "." {
		fileName = "output"
	}
	if !strings.Contains(fileName, fileExtension) {
		fileName += fileExtension
	}
	return path.Join(builder.directory, fileName)
}

func (builder *Builder) buildPlaylist(dir string) {
	playlistFile := PlaylistFile(dir)
	outputFile := builder.outputFile(dir)
	args := []string{
		"-allowed_extensions", "ALL",
		"-protocol_whitelist", "file,crypto",
		"-i", playlistFile,
		"-c", "copy",
		"-y", outputFile,
	}
	run(args)
}

func (builder *Builder) make() {
	var inputIndex int = 0
	inputs := []string{"-i", builder.outputFile(builder.Video)}
	inputsMap := []string{"-map", fmt.Sprintf("%d:v", inputIndex)}
	actions := []string{"-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text"}
	metaData := []string{}

	var outputFile string
	if builder.Output == "" {
		outputFile = builder.outputFile(builder.Input)
	} else {
		outputFile = builder.outputFile(builder.Output)
	}

	if len(builder.Audio) == 0 {
		inputsMap = append(inputsMap, "-map", fmt.Sprintf("%d:a", inputIndex))
	}

	for index, audio := range builder.Audio {
		inputIndex++
		inputs = append(inputs, "-i", builder.outputFile(audio))
		inputsMap = append(inputsMap, "-map", fmt.Sprintf("%d:a", inputIndex))
		metaData = append(metaData, buildMetaData("a", index, audio)...)
	}

	for index, subtitle := range builder.Subtitle {
		inputIndex++
		inputs = append(inputs, "-i", SrtFile(subtitle))
		inputsMap = append(inputsMap, "-map", fmt.Sprintf("%d:s", inputIndex))
		metaData = append(metaData, buildMetaData("s", index, subtitle)...)
	}

	args := []string{}
	args = append(args, inputs...)
	args = append(args, inputsMap...)
	args = append(args, actions...)
	args = append(args, metaData...)
	args = append(args, "-y", outputFile)
	run(args)
}

func (builder *Builder) Build() {
	if builder.Output != "" {
		builder.directory = path.Dir(builder.Output)
		helper.MakeDirectories(builder.directory)
	}

	if builder.directory == "" {
		builder.directory = builder.Input
	}

	builder.buildPlaylist(builder.Video)
	for _, audio := range builder.Audio {
		builder.buildPlaylist(audio)
	}

	builder.make()
}

func buildMetaData(input string, index int, dir string) []string {
	language := path.Base(dir)
	return []string{
		fmt.Sprintf("-metadata:s:%s:%d", input, index),
		fmt.Sprintf("language=%s", helper.ConvertISO6391ToISO6392(language)),
	}
}

func app() string {
	name := "ffmpeg"
	app, err := exec.LookPath(name)
	if err != nil {
		fmt.Println("Add", name, "to the system PATH")
		os.Exit(0)
	}
	return app
}

func run(args []string) {
	cmd := exec.Command(app(), args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
