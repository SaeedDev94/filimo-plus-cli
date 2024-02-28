import { ChildProcess, exec } from 'child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from '../Auth/AuthService';
import { ClientService } from '../Client/ClientService';
import { IDownload } from '../Data/DataInterface';

export class DownloadService {

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private absolutePath: string,
    private quality: string,
    private language?: string,
  ) {
  }

  private strTimeToSeconds = (time: string): number => {
    const timeParts = time.split(':');
    const nextPart = (): number => Number(timeParts.pop()) || 0;
    let seconds = 0;
    seconds += nextPart(); // s
    seconds += nextPart() * 60; // m
    seconds += nextPart() * 60 * 60; // h
    return seconds;
  }

  private dlScript(): string {
    return process.platform === 'linux' ?
      `bash ${join(this.absolutePath, 'dl.bash')}` :
      join(this.absolutePath, 'dl.bat');
  }

  calcDownloadProgress(id: string): number {
    const log: string = readFileSync(this.logFile(id)).toString();

    let totalDuration = 0;
    const strTotalDuration = [...log.matchAll(/Duration: (.*), start:/g)]
      .map((i) => i[1])
      .pop();
    if (strTotalDuration) {
      totalDuration = this.strTimeToSeconds(strTotalDuration);
    }

    let currentTime = 0;
    const strCurrentTime = [...log.matchAll(/time=(.*) bitrate/g)]
      .map((i) => i[1])
      .pop();
    if (strCurrentTime) {
      currentTime = this.strTimeToSeconds(strCurrentTime);
    }

    const floatProgress = (currentTime / (totalDuration ? totalDuration : 1)) * 100;
    const intProgress = Math.round(floatProgress);

    return intProgress > 100 ? 100 : intProgress;
  }

  movieDir(): string {
    return join(this.absolutePath, 'movie');
  }

  downloadDir(id: string): string {
    return join(this.movieDir(), id);
  }

  infoFile(id: string): string {
    return join(this.downloadDir(id), 'info.json');
  }

  logFile(id: string): string {
    return join(this.downloadDir(id), `${id}.log`);
  }

  subtitleFile(id: string, language: string): string {
    return join(this.downloadDir(id), `${id}_${language}.srt`);
  }

  itemFile(id: string): string {
    const name = [id, this.quality, this.language].filter(part => !!part).join('_');
    return join(this.downloadDir(id), `${name}.mp4`);
  }

  async start(download: IDownload, video: string, audio?: string): Promise<ChildProcess> {
    // Create movie dir
    if (!existsSync(this.movieDir())) mkdirSync(this.movieDir());

    // Create download dir
    if (!existsSync(this.downloadDir(download.id))) mkdirSync(this.downloadDir(download.id));

    // Create info file
    const info: string = JSON.stringify({ id: download.id, name: download.name });
    if (!existsSync(this.infoFile(download.id))) writeFileSync(this.infoFile(download.id), info);

    // Create log file
    closeSync(openSync(this.logFile(download.id), 'w'));

    // Download subtitles
    for (let i = 0 ; i < download.subtitles.length ; i++) {
      const subtitle = download.subtitles[i];
      const file = this.subtitleFile(download.id, subtitle.language);
      if (existsSync(file)) continue;
      console.log(`Subtitle [${subtitle.language.toUpperCase()}]`);
      const data = await this.clientService.sendRequest(subtitle.link);
      const txt = data.responseBody.toString().replace('WEBVTT', '').trim() + '\n';
      writeFileSync(file, txt);
      console.log('Subtitle downloaded:', file);
    }

    // Create download command
    const dlScript: string = this.dlScript();
    const headers: string = `User-Agent: ${this.authService.getUserAgent()}; Cookie: AuthV1=${this.authService.getToken()};`;
    const itemFile: string = this.itemFile(download.id);
    const logFile: string = this.logFile(download.id);
    const dlCommand: string = `${dlScript} "${headers}" "${itemFile}" "${logFile}" "${video}" "${audio ? audio : ''}"`;

    // Start download process
    return exec(dlCommand);
  }

}
