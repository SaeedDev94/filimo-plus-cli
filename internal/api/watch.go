package api

import (
	"encoding/json"
	"fmt"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Watch struct {
	Data WatchData `json:"data"`
}

type WatchData struct {
	Attributes WatchAttributes `json:"attributes"`
}

type WatchAttributes struct {
	Name      string          `json:"movie_title"`
	Sources   [][]WatchSource `json:"multiSRC"`
	Subtitles []WatchSubtitle `json:"tracks"`
}

type WatchSource struct {
	Type string `json:"type"`
	Link string `json:"src"`
}

type WatchSubtitle struct {
	Language string `json:"srclang"`
	Link     string `json:"src"`
}

func GetWatch(client helper.HttpClient, id string) Watch {
	var watch Watch
	response, statusErr := client.Get(fmt.Sprintf("https://api.filimo.com/api/fa/v1/movie/watch/watch/uid/%s", id))
	if statusErr != nil {
		panic(statusErr)
	}
	err := json.Unmarshal([]byte(response), &watch)
	if err != nil {
		panic(err)
	}
	return watch
}
