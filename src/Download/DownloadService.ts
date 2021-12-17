import { ChildProcess, exec, ExecException } from 'child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ClientService } from '../Client/ClientService';
import { IDownload } from '../Dom/DomInterface';
import { absolutePath } from '../FilimoPlusCli';

export class DownloadService {

  constructor(
    private clientService: ClientService,
    private quality: string
  ) {
  }

  private static dlScript(): string | null {
    switch (process.platform) {
      case 'linux':
        return `bash ${join(absolutePath, 'dl.bash')}`;
      case 'win32':
        return join(absolutePath, 'dl.bat');
      default:
        return null;
    }
  }

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
    const log: string = readFileSync(this.logFile(id)).toString();

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

  movieDir(): string {
    return join(absolutePath, 'movie');
  }

  downloadDir(id: string): string {
    return join(this.movieDir(), id, this.quality);
  }

  infoFile(id: string): string {
    return join(this.downloadDir(id), 'info.json');
  }

  logFile(id: string): string {
    return join(this.downloadDir(id), `${id}.log`);
  }

  subtitleFile(id: string): string {
    return join(this.downloadDir(id), `${id}.srt`);
  }

  itemFile(id: string): string {
    return join(this.downloadDir(id), `${id}.mp4`);
  }

  async start(download: IDownload, video: string, audio?: string): Promise<ChildProcess> {
    // Create movie dir
    if (!existsSync(this.movieDir())) mkdirSync(this.movieDir());

    // Create download dir
    if (!existsSync(this.downloadDir(download.id))) mkdirSync(this.downloadDir(download.id), { recursive: true });

    // Create info file
    const info: string = JSON.stringify({ id: download.id, name: download.name });
    writeFileSync(this.infoFile(download.id), info);

    // Create log file
    closeSync(openSync(this.logFile(download.id), 'w'));

    // Download subtitle
    if (download.subtitle) {
      console.log('Downloading the subtitle ...');
      const data = await this.clientService.sendRequest(download.subtitle);
      const subtitle = data.responseBody.toString().replace('WEBVTT', '').trim() + '\n';
      writeFileSync(this.subtitleFile(download.id), subtitle);
      console.log('Subtitle downloaded:', this.subtitleFile(download.id));
    }

    // Create download command
    const dlScript: string = DownloadService.dlScript()!;
    const dlArgs: string[] = [
      this.itemFile(download.id),
      this.logFile(download.id),
      video,
      audio ? audio : ''
    ];
    const dlCommand: string = [dlScript, ...dlArgs].join(' ');

    // Create download executor
    const dlExecutor = (resolve: (value: ChildProcess) => void, reject: (exception: ExecException) => void): void => {
      const process: ChildProcess = exec(dlCommand, (error: ExecException | null) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(process);
      });
    };

    // Start download process
    return new Promise<ChildProcess>(dlExecutor);
  }

}
