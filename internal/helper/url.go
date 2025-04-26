package helper

import "net/url"

func AbsoluteUrl(first string, second string) *url.URL {
	firstUrl, firstErr := url.Parse(first)
	secondUrl, secondErr := url.Parse(second)
	if firstErr != nil {
		panic(firstErr)
	}
	if secondErr != nil {
		panic(secondErr)
	}
	if secondUrl.IsAbs() {
		return secondUrl
	}
	firstUrl.RawQuery = ""
	firstUrl.ForceQuery = false
	return firstUrl.ResolveReference(secondUrl)
}
