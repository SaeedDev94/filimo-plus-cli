import { ChildProcess, exec, ExecException } from 'child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ClientService } from '../Client/ClientService';
import { IDownload } from '../Dom/DomInterface';
import { absolutePath } from '../App';

export class DownloadService {

  constructor(
    private clientService: ClientService
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
    const downloadDir: string = join(this.movieDir(), id);
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

  movieDir(): string {
    return join(absolutePath, 'movie');
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

  subtitleFile(id: string): string {
    return join(this.downloadDir(id), `${id}.srt`);
  }

  itemFile(id: string): string {
    return join(this.downloadDir(id), `${id}.mp4`);
  }

  async start(download: IDownload, video: string, audio: string | null): Promise<ChildProcess> {
    // Create movie dir
    if (!existsSync(this.movieDir())) mkdirSync(this.movieDir());
    // Create download dir
    if (!existsSync(this.downloadDir(download.id))) mkdirSync(this.downloadDir(download.id));
    // Create info file
    writeFileSync(this.infoFile(download.id), JSON.stringify({
      id: download.id,
      name: download.name,
    }));
    // Create log file
    closeSync(openSync(this.logFile(download.id), 'w'));
    // Download subtitle
    if (download.subtitle) {
      console.log('This item has subtitle');
      console.log('Downloading the subtitle ...');
      const res = await this.clientService.getInstance().get(download.subtitle);
      const subtitle = res.data.replace('WEBVTT', '').trim() + '\n';
      writeFileSync(this.subtitleFile(download.id), subtitle);
      console.log('Subtitle downloaded:', this.subtitleFile(download.id));
    }
    // Start download process
    return new Promise<ChildProcess>((resolve: (value: ChildProcess) => void, reject: (exception: ExecException) => void) => {
      const dlCommand: string = `${DownloadService.dlScript()} "${this.itemFile(download.id)}" "${this.logFile(download.id)}" "${video}" "${audio ? audio : ''}"`;
      const process = exec(dlCommand, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(process);
      });
    });
  }

}
