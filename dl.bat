if NOT "%~4"=="" goto separateAudio
goto videoWithAudio

:separateAudio
ffmpeg -i %3 -i %4 -map 0:v -map 1:a -codec copy -shortest -y %1\\%2.mp4 <nul >nul 2> %1\\%2.log
goto done

:videoWithAudio
ffmpeg -i %3 -codec copy -y %1\\%2.mp4 <nul >nul 2> %1\\%2.log
goto done

:done
