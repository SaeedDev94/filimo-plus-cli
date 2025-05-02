package stream

import (
	"fmt"
	"path"
	"strings"

	"github.com/saeeddev94/filimo-plus-cli/internal/api"
	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

func DownloadDir(name string) string {
	return path.Join("media", name)
}

func SubtitleDir(base string) string {
	return path.Join(base, "subtitle")
}

func VideoDir(base string) string {
	return path.Join(base, "video")
}

func AudioDir(base string) string {
	return path.Join(base, "audio")
}

func SrtFile(dir string) string {
	return path.Join(dir, "subtitle.srt")
}

func PlaylistFile(dir string) string {
	return path.Join(dir, "playlist.m3u8")
}

func DownloadSubtitle(client helper.HttpClient, subtitle api.WatchSubtitle, base string) {
	fmt.Printf("Subtitle [%s]\n", subtitle.Language)
	content, statusErr := client.Get(subtitle.Link)
	if statusErr != nil {
		panic(statusErr)
	}
	dir := path.Join(SubtitleDir(base), subtitle.Language)
	file := SrtFile(dir)
	content = strings.ReplaceAll(content, "WEBVTT", "")
	content = strings.TrimSpace(content) + "\n"
	helper.WriteFile(file, content)
}

func DownloadVideo(client helper.HttpClient, variant HlsVideoVariant, base string) {
	dir := path.Join(VideoDir(base), variant.Quality)
	download(client, variant.Link, dir)
}

func DownloadAudio(client helper.HttpClient, track HlsAudioTrack, base string) {
	dir := path.Join(AudioDir(base), track.Language)
	download(client, track.Link, dir)
}

func download(client helper.HttpClient, link string, dir string) {
	playlist := GetPlaylist(client, link)
	helper.WriteFile(PlaylistFile(dir), playlist.Content)
	for _, chunkUrl := range playlist.Urls {
		chunkPath := path.Join(dir, path.Base(chunkUrl.Path))
		client.DownloadFile(chunkUrl.String(), chunkPath)
	}
}
