package helper

import "strings"

func StringToList(value string) []string {
	list := []string{}
	value = strings.TrimSpace(value)
	for item := range strings.SplitSeq(value, ",") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		list = append(list, item)
	}
	return list
}
