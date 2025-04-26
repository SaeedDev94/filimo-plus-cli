package stream

import (
	"net/url"
	"regexp"
	"strings"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Playlist struct {
	Content string
	Urls    []*url.URL
}

func GetPlaylist(client helper.HttpClient, link string) Playlist {
	playlist, statusErr := client.Get(link)
	if statusErr != nil {
		panic(statusErr)
	}
	return Playlist{
		Content: content(playlist),
		Urls:    urls(playlist, link),
	}
}

func content(playlist string) string {
	pattern := `\?([^"\n]*)`
	return regexp.MustCompile(pattern).ReplaceAllString(playlist, "")
}

func urls(playlist string, link string) []*url.URL {
	urls := []*url.URL{}

	keyPattern := `#EXT-X-KEY(.*)URI="(.*)"`
	keyMatches := regexp.MustCompile(keyPattern).FindStringSubmatch(playlist)
	key := keyMatches[2]

	chunksPattern := `(?m)^([^#].*)`
	chunksMatches := regexp.MustCompile(chunksPattern).FindAllString(playlist, -1)

	urls = append(urls, helper.AbsoluteUrl(link, key))
	for _, value := range chunksMatches {
		chunk := strings.TrimSpace(value)
		if chunk == "" {
			continue
		}
		urls = append(urls, helper.AbsoluteUrl(link, chunk))
	}

	if key == "" {
		panic("Playlist key not found")
	}
	if len(urls) <= 1 {
		panic("Playlist has no chunks")
	}

	return urls
}
