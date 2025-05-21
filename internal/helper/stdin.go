package helper

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func Input(label string) string {
	fmt.Println(label)
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')
	return strings.TrimSpace(input)
}

func Question(label string, options []string) []int {
	question := label
	for index, option := range options {
		question += fmt.Sprintf("\n%d) %s", index+1, option)
	}
	choices := []int{}
	for _, input := range StringToList(Input(question)) {
		answer, err := strconv.Atoi(input)
		if err != nil || (answer < 1 || answer > len(options)) {
			fmt.Println("Invalid answer")
			return Question(label, options)
		}
		choices = append(choices, answer-1)
	}
	return choices
}
