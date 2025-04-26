package helper

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"
)

type HttpClient struct {
	Token     string
	UserAgent string
}

func (client HttpClient) setRequestHeaders(request *http.Request) {
	if client.Token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", client.Token))
	}
	if client.UserAgent != "" {
		request.Header.Set("User-Agent", client.UserAgent)
	}
}

func (client HttpClient) newRequest(method string, url string, payload []byte) *http.Request {
	var body io.Reader = nil
	if len(payload) > 0 {
		body = bytes.NewBuffer(payload)
	}
	request, err := http.NewRequest(method, url, body)
	if err != nil {
		panic(err)
	}
	client.setRequestHeaders(request)
	return request
}

func (client HttpClient) downloadFile(url string, path string) error {
	request := client.newRequest("GET", url, nil)
	response, resErr := newResponse(request)
	if resErr != nil {
		return resErr
	}
	defer response.Body.Close()
	statusErr := statusError(response)
	if statusErr != nil {
		return statusErr
	}
	_, ioErr := responseToFile(response, path)
	if ioErr != nil {
		return ioErr
	}
	return nil
}

func (client HttpClient) Get(url string) (string, error) {
	request := client.newRequest("GET", url, nil)
	response, err := newResponse(request)
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	return responseToString(response), statusError(response)
}

func (client HttpClient) DownloadFile(url string, path string) {
	const maxRetries int = 6
	for atempt := 1; atempt <= maxRetries; atempt++ {
		fmt.Printf("Downloading: %s, atempt #%d\n", path, atempt)
		err := client.downloadFile(url, path)
		if err == nil {
			return
		}
		if !isNetworkError(err) {
			panic(err)
		}
		if atempt == maxRetries {
			panic(fmt.Sprintf("Failed to download: %s", url))
		}
		fmt.Println("Network error! retrying ...")
		time.Sleep(10 * time.Second)
	}
}

func newResponse(request *http.Request) (*http.Response, error) {
	client := &http.Client{}
	return client.Do(request)
}

func responseToString(response *http.Response) string {
	body, err := io.ReadAll(response.Body)
	if err != nil {
		panic(err)
	}
	return string(body)
}

func responseToFile(response *http.Response, path string) (int64, error) {
	file := CreateFile(path)
	defer file.Close()
	return io.Copy(file, response.Body)
}

func isNetworkError(err error) bool {
	var netErr net.Error
	return errors.As(err, &netErr)
}

func statusError(response *http.Response) error {
	var err error = nil
	if response.StatusCode != 200 {
		err = fmt.Errorf("HTTP %d", response.StatusCode)
	}
	return err
}
