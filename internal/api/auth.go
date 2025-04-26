package api

import (
	"encoding/json"

	"github.com/saeeddev94/filimo-plus-cli/internal/helper"
)

type Auth struct {
	Data AuthData `json:"data"`
}

type AuthData struct {
	User AuthUser `json:"user"`
}

type AuthUser struct {
	Profile AuthProfile `json:"selectedProfile"`
}

type AuthProfile struct {
	Name string `json:"name"`
}

func GetUserName(client helper.HttpClient) string {
	var auth Auth
	response, statusErr := client.Get("https://api.filimo.com/api/fa/v1/web/config/uxEvent")
	if statusErr != nil {
		panic(statusErr)
	}
	err := json.Unmarshal([]byte(response), &auth)
	if err != nil {
		panic(err)
	}
	return auth.Data.User.Profile.Name
}
