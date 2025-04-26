package cli

import (
	"fmt"

	"github.com/saeeddev94/filimo-plus-cli/internal/api"
	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
	"github.com/saeeddev94/filimo-plus-cli/internal/stream"
)

func Download(app App, args Args) {
	if args.Version {
		app.PrintVersion()
		return
	}
	if args.Author {
		app.PrintAuthor()
		return
	}
	if args.Help {
		args.PrintHelp()
		return
	}

	app.PrintVersion()
	app.PrintAuthor()

	authToken := helper.AuthToken{
		Path:      helper.TokenPath(app.BasePath),
		FlagValue: args.Token,
	}

	token := authToken.Get()
	if token == "" {
		fmt.Println("You don't have auth token")
		token = helper.Input("Enter token:")
		if token == "" {
			panic("No token!")
		}
		authToken.Set(token)
	}

	httpClient := helper.HttpClient{
		Token:     token,
		UserAgent: helper.GetUserAgent(),
	}

	username := api.GetUserName(httpClient)
	if username == "" {
		authToken.Delete()
		panic("Invalid auth token")
	}
	fmt.Println("Username:", username)

	id := args.Id
	if id == "" {
		id = helper.Input("Enter id:")
		if id == "" {
			panic("No id!")
		}
	}

	watch := api.GetWatch(httpClient, id)
	hls := stream.GetHls(httpClient, watch)

	fmt.Println("Name:", watch.Data.Attributes.Name)

	var selectedVariants []int
	if len(hls.Variants) > 0 {
		options := []string{}
		for _, variant := range hls.Variants {
			options = append(options, fmt.Sprintf("%s - %s", variant.Resolution, variant.Quality))
		}
		selectedVariants = helper.Question(VIDEO_STEP, options)
	}

	var selectedTracks []int
	if len(hls.Tracks) > 0 {
		options := []string{}
		for _, track := range hls.Tracks {
			options = append(options, track.Language)
		}
		selectedTracks = helper.Question(AUDIO_STEP, options)
	}

	var selectedSubtitles []int
	if len(watch.Data.Attributes.Subtitles) > 0 {
		options := []string{}
		for _, subtitle := range watch.Data.Attributes.Subtitles {
			options = append(options, subtitle.Language)
		}
		selectedSubtitles = helper.Question(SUBTITLE_STEP, options)
	}

	for _, item := range selectedSubtitles {
		subtitle := watch.Data.Attributes.Subtitles[item]
		stream.DownloadSubtitle(httpClient, subtitle, id)
	}

	for _, item := range selectedVariants {
		variant := hls.Variants[item]
		stream.DownloadVideo(httpClient, variant, id)
	}

	for _, item := range selectedTracks {
		track := hls.Tracks[item]
		stream.DownloadAudio(httpClient, track, id)
	}
}
