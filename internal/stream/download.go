package stream

import (
	"fmt"
	"path"
	"strings"

	"github.com/saeeddev94/filimo-plus-cli/internal/api"
	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

func DownloadDir(id string) string {
	return path.Join("media", id)
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

func SubtitlePath(base string, language string) string {
	return path.Join(SubtitleDir(base), language)
}

func VideoPath(base string, quality string) string {
	return path.Join(VideoDir(base), quality)
}

func AudioPath(base string, language string) string {
	return path.Join(AudioDir(base), language)
}

func SrtFile(dir string) string {
	return path.Join(dir, "subtitle.srt")
}

func PlaylistFile(dir string) string {
	return path.Join(dir, "playlist.m3u8")
}

func DownloadSubtitle(client helper.HttpClient, subtitle api.WatchSubtitle, id string) {
	fmt.Printf("Subtitle [%s]\n", subtitle.Language)
	content, statusErr := client.Get(subtitle.Link)
	if statusErr != nil {
		panic(statusErr)
	}
	dir := SubtitlePath(DownloadDir(id), subtitle.Language)
	file := SrtFile(dir)
	content = strings.ReplaceAll(content, "WEBVTT", "")
	content = strings.TrimSpace(content) + "\n"
	helper.WriteFile(file, content)
}

func DownloadVideo(client helper.HttpClient, variant HlsVideoVariant, id string) {
	download(client, variant.Link, variant.Quality, id, true)
}

func DownloadAudio(client helper.HttpClient, track HlsAudioTrack, id string) {
	download(client, track.Link, track.Language, id, false)
}

func download(client helper.HttpClient, link string, name string, id string, isVideo bool) {
	playlist := GetPlaylist(client, link)
	var dir string
	if isVideo {
		dir = VideoPath(DownloadDir(id), name)
	} else {
		dir = AudioPath(DownloadDir(id), name)
	}
	helper.WriteFile(PlaylistFile(dir), playlist.Content)
	for _, chunkUrl := range playlist.Urls {
		chunkPath := path.Join(dir, path.Base(chunkUrl.Path))
		client.DownloadFile(chunkUrl.String(), chunkPath)
	}
}
