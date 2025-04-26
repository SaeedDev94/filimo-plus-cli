package stream

import (
	"fmt"
	"regexp"

	"github.com/saeeddev94/filimo-plus-cli/internal/api"
	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Hls struct {
	Variants []HlsVideoVariant
	Tracks   []HlsAudioTrack
}

type HlsVideoVariant struct {
	Quality    string
	Resolution string
	Link       string
}

type HlsAudioTrack struct {
	Language string
	Link     string
}

func GetHls(client helper.HttpClient, watch api.Watch) Hls {
	link := link(watch)
	if link == "" {
		panic("HLS link not found")
	}
	hls, statusErr := client.Get(link)
	if statusErr != nil {
		panic(statusErr)
	}
	return Hls{
		Variants: variants(hls),
		Tracks:   tracks(hls),
	}
}

func link(watch api.Watch) string {
	var link string
	for _, list := range watch.Data.Attributes.Sources {
		for _, source := range list {
			if source.Type == "application/vnd.apple.mpegurl" {
				link = source.Link
				break
			}
		}
	}
	return link
}

func variants(hls string) []HlsVideoVariant {
	list := []HlsVideoVariant{}
	pattern := `#(\d+(.*?))\n(.*)RESOLUTION=([^,]*)(.*?)\n(.*)`
	rows := regexp.MustCompile(pattern).FindAllStringSubmatch(hls, -1)
	for _, matches := range rows {
		variant := HlsVideoVariant{
			Quality:    matches[1],
			Resolution: matches[4],
			Link:       matches[6],
		}
		if variant.Link == "" {
			panic(fmt.Sprintf("Video variant [%s] link not found", variant.Quality))
		}
		list = append(list, variant)
	}
	if len(list) == 0 {
		panic("No video variants found")
	}
	return list
}

func tracks(hls string) []HlsAudioTrack {
	list := []HlsAudioTrack{}
	pattern := `GROUP-ID="audio",LANGUAGE="(.*)",NAME(.*)URI="(.*)"`
	rows := regexp.MustCompile(pattern).FindAllStringSubmatch(hls, -1)
	for _, matches := range rows {
		track := HlsAudioTrack{
			Language: matches[1],
			Link:     matches[3],
		}
		if track.Link == "" {
			panic(fmt.Sprintf("Audio track [%s] link not found", track.Language))
		}
		list = append(list, track)
	}
	return list
}
