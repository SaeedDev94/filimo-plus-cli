if NOT "%~5"=="" goto separateAudio
goto videoWithAudio

:separateAudio
ffmpeg -headers %1 -i %4 -i %5 -map 0:v -map 1:a -codec copy -shortest -y %2 <nul >nul 2> %3
goto done

:videoWithAudio
ffmpeg -headers %1 -i %4 -codec copy -y %2 <nul >nul 2> %3
goto done

:done
