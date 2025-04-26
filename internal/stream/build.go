package stream

import (
	"fmt"
	"os"
	"os/exec"
	"path"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Builder struct {
	Direcroty string
	Video     string
	Audio     []string
	Subtitle  []string
}

func (builder Builder) make(fileName string) {
	var inputIndex int = 0
	inputs := []string{"-i", stremaFile(builder.Video)}
	inputsMap := []string{"-map", fmt.Sprintf("%d:v", inputIndex)}
	actions := []string{"-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text"}
	metaData := []string{}

	if len(builder.Audio) == 0 {
		inputsMap = append(inputsMap, "-map", fmt.Sprintf("%d:a", inputIndex))
	}

	for index, audio := range builder.Audio {
		inputIndex++
		inputs = append(inputs, "-i", stremaFile(audio))
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
	args = append(args, "-y", fileName)
	run(args)
}

func (builder Builder) Build() {
	fileName := path.Join(builder.Direcroty, "video.mp4")

	buildPlaylist(builder.Video)
	for _, audio := range builder.Audio {
		buildPlaylist(audio)
	}

	builder.make(fileName)
}

func stremaFile(dir string) string {
	return path.Join(dir, "stream.mp4")
}

func buildMetaData(input string, index int, dir string) []string {
	language := path.Base(dir)
	return []string{
		fmt.Sprintf("-metadata:s:%s:%d", input, index),
		fmt.Sprintf("language=%s", helper.ConvertISO6391ToISO6392(language)),
	}
}

func buildPlaylist(dir string) {
	playlistFile := PlaylistFile(dir)
	streamFile := stremaFile(dir)
	if helper.IsFileExists(streamFile) {
		return
	}
	args := []string{
		"-allowed_extensions", "ALL",
		"-protocol_whitelist", "file,crypto",
		"-i", playlistFile,
		"-c", "copy",
		streamFile,
	}
	run(args)
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
