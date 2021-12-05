import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ClientService } from '../Client/ClientService';
import { IDownload } from '../Dom/DomInterface';

export class DownloadService {

  constructor(
    private clientService: ClientService
  ) {
  }

  private static readonly movieDir: string = join(process.cwd(), 'movie');

  static calcDownloadProgress(id: string): number {
    const downloadDir: string = join(DownloadService.movieDir, id);
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

  static strTimeToSeconds(time: string): number {
    let seconds = 0;
    const timeParts = time.split(':');
    const secondText = timeParts.pop();
    seconds += secondText ? Number(secondText) || 0 : 0;
    const minuteText = timeParts.pop();
    seconds += minuteText ? (Number(minuteText) || 0) * 60 : 0;
    const hourText = timeParts.pop();
    seconds += hourText ? (Number(hourText) || 0) * 60 * 60 : 0;
    return seconds;
  }

  async start(download: IDownload, video: string, audio: string | null): Promise<boolean> {
    if (!existsSync(DownloadService.movieDir)) mkdirSync(DownloadService.movieDir);

    const downloadDir = join(DownloadService.movieDir, download.id);
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

    execSync(`bash ${process.cwd()}/dl.bash "${downloadDir}" "${download.id}" "${video}" "${audio ? audio : ''}"`);

    return true;
  }

}
