#!/bin/bash

downloadPath="$1"
id="$2"

logFile="$downloadPath/$id.log"
videoFile="$downloadPath/$id.mp4"

videoStream="$3"
audioStream="$4"

if [ -n "$audioStream" ]
then
  ffmpeg -i "$videoStream" -i "$audioStream" -map 0:v -map 1:a -codec copy -shortest -y "$videoFile" </dev/null >/dev/null 2> "$logFile" &
else
  ffmpeg -i "$videoStream" -codec copy -y "$videoFile" </dev/null >/dev/null 2> "$logFile" &
fi
