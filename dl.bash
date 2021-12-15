#!/bin/bash

itemFile="$1"
logFile="$2"

videoStream="$3"
audioStream="$4"

if [ -n "$audioStream" ]
then
  ffmpeg -i "$videoStream" -i "$audioStream" -map 0:v -map 1:a -codec copy -shortest -y "$itemFile" </dev/null >/dev/null 2> "$logFile" &
else
  ffmpeg -i "$videoStream" -codec copy -y "$itemFile" </dev/null >/dev/null 2> "$logFile" &
fi
