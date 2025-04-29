package helper

import "net/url"

func NewUrl(address string) *url.URL {
	url, err := url.Parse(address)
	if err != nil {
		panic(err)
	}
	return url
}

func AbsoluteUrl(first string, second string) *url.URL {
	firstUrl := NewUrl(first)
	secondUrl := NewUrl(second)
	if secondUrl.IsAbs() {
		return secondUrl
	}
	firstUrl.RawQuery = ""
	firstUrl.ForceQuery = false
	return firstUrl.ResolveReference(secondUrl)
}
