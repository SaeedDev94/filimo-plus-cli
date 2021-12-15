import { exec, execSync } from 'child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ClientService } from '../Client/ClientService';
import { IDownload } from '../Dom/DomInterface';
import { absolutePath } from '../App';

export class DownloadService {

  constructor(
    private clientService: ClientService
  ) {
    this.movieDir = join(absolutePath, 'movie');
  }

  readonly movieDir: string;

  private static strTimeToSeconds(time: string): number {
    const timeParts = time.split(':');
    const nextPart = (): number => Number(timeParts.pop()) || 0;
    let seconds = 0;
    seconds += nextPart(); // s
    seconds += nextPart() * 60; // m
    seconds += nextPart() * 60 * 60; // h
    return seconds;
  }

  calcDownloadProgress(id: string): number {
    const downloadDir: string = join(this.movieDir, id);
    const logFile: string = join(downloadDir, `${id}.log`);
    const log: string = readFileSync(logFile).toString();

    let totalDuration = 0;
    const strTotalDuration = [...log.matchAll(/Duration: (.*), start:/g)]
      .map((i) => i[1])
      .pop();
    if (strTotalDuration) {
      totalDuration = DownloadService.strTimeToSeconds(strTotalDuration);
    }

    let currentTime = 0;
    const strCurrentTime = [...log.matchAll(/time=(.*) bitrate/g)]
      .map((i) => i[1])
      .pop();
    if (strCurrentTime) {
      currentTime = DownloadService.strTimeToSeconds(strCurrentTime);
    }

    const floatProgress = (currentTime / (totalDuration ? totalDuration : 1)) * 100;
    const intProgress = Math.round(floatProgress);

    return intProgress > 100 ? 100 : intProgress;
  }

  async start(download: IDownload, video: string, audio: string | null): Promise<boolean> {
    if (!existsSync(this.movieDir)) mkdirSync(this.movieDir);

    const downloadDir = join(this.movieDir, download.id);
    const infoFile = join(downloadDir, 'info.json');
    const subtitleFile = join(downloadDir, `${download.id}.srt`);

    if (!existsSync(downloadDir)) mkdirSync(downloadDir);

    writeFileSync(infoFile, JSON.stringify({
      id: download.id,
      name: download.name,
    }));

    if (download.subtitle) {
      console.log('This item has subtitle');
      console.log('Downloading the subtitle ...');
      const res = await this.clientService.getInstance().get(download.subtitle);
      const subtitle = res.data.replace('WEBVTT', '').trim() + '\n';
      writeFileSync(subtitleFile, subtitle);
      console.log('Subtitle downloaded:', subtitleFile);
    }

    if (process.platform === 'win32') {
      closeSync(openSync(`${downloadDir}\\${download.id}.log`, 'w'));
      exec(`${absolutePath}\\dl.bat "${downloadDir}" "${download.id}" "${video}" "${audio ? audio : ''}"`);
    }

    if (process.platform === 'linux') {
      execSync(`bash ${absolutePath}/dl.bash "${downloadDir}" "${download.id}" "${video}" "${audio ? audio : ''}"`);
    }

    return true;
  }

}
