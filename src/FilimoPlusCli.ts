#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './Auth/AuthService';
import { ClientService } from './Client/ClientService';
import { IDownloadTrack, IDownloadVariant } from './Dom/DomInterface';
import { DomService } from './Dom/DomService';
import { DownloadService } from './Download/DownloadService';
import { ReadlineService } from './Readline/ReadlineService';

class FilimoPlusCli {

  constructor(
    private absolutePath: string
  ) {
    this.package = JSON.parse(readFileSync(join(this.absolutePath, 'package.json')).toString());
  }

  private package: {
    name: string,
    version: string,
    author: {
      name: string,
      email: string,
      url: string
    }
  };

  async main(args: string[]): Promise<void> {
    if (['linux', 'win32'].indexOf(process.platform) === -1) {
      console.error('Sorry!');
      console.error('You are using an unsupported platform');
      return;
    }

    try {
      execSync('ffmpeg -version');
    } catch (error) {
      console.error('Please install ffmpeg');
      return;
    }

    const firstArg: string | undefined = args[0];

    if (firstArg === '--version') {
      this.printVersion();
      return;
    }

    if (firstArg === '--author') {
      this.printAuthor();
      return;
    }

    this.printVersion();
    this.printAuthor();

    await this.download(firstArg);
  }

  private printVersion(): void {
    console.log(`${this.package.name} v${this.package.version}`);
  }

  private printAuthor(): void {
    console.log(`Author: ${this.package.author.name}`);
  }

  private async download(itemId?: string): Promise<void> {
    let id: string | undefined = itemId;

    const authService = new AuthService();
    const userAgent: string = authService.getUserAgent();
    const authToken: string | null = authService.getToken();

    const clientService = new ClientService(userAgent, authToken);

    if (!authToken) {
      console.log("You don't have auth token");
      const token = await ReadlineService.question('Enter auth token:');
      if (!token) throw new Error('No token!');
      clientService.setToken(token);
      authService.saveToken(token);
    }

    const domService = new DomService(clientService);

    console.log('Check auth token ...');
    const userName = await domService.getUserName();
    if (userName) {
      console.log(`UserName: ${userName}`);
    } else {
      authService.deleteToken();
      throw new Error('Invalid auth token');
    }

    if (!id) id = await ReadlineService.question('Enter id:');
    if (!id) throw new Error(`Invalid id: "${id}"`);
    console.log(`Getting "${id}" info ...`);
    const download = await domService.getDownload(id);
    console.log(`Name: "${download.name}"`);

    let variants: IDownloadVariant[] = [];
    if (download.variants.length === 1) variants = download.variants;
    if (download.variants.length >= 2) {
      const selectedVariants: string = await ReadlineService.question(
        'Select variants: [comma separated]',
        download.variants.map((item) => `${item.resolution} - ${item.quality}`)
      );
      selectedVariants.split(',').forEach((selected: string) => {
        const index: number = Number(selected) - 1;
        if (Number.isNaN(index) || !download.variants[index]) throw new Error(`Invalid variant: "${selected}"`);
        variants.push(download.variants[index]);
      });
    }

    let track: IDownloadTrack | undefined = undefined;
    if (download.tracks.length === 1) track = download.tracks[0];
    if (download.tracks.length >= 2) {
      const selected: string = await ReadlineService.question(
        'Select an audio track:',
        download.tracks.map((item) => item.language)
      );
      const index: number = Number(selected) - 1;
      if (Number.isNaN(index) || !download.tracks[index]) throw new Error(`Invalid track: "${selected}"`);
      track = download.tracks[index];
    }

    for (let i = 0 ; i < variants.length ; i++) {
      const variant: IDownloadVariant = variants[i];
      const downloadService = new DownloadService(authService, clientService, variant.quality);
      console.log(`[${variant.quality}]`);
      console.log('Starting download ...');
      try {
        await downloadService.start(download, variant.link, track?.link);
        console.log('Download started:');
        await this.watch(downloadService, download.id);
      } catch (exception) {
        console.error('Oops!', exception);
        throw new Error('Somethings went wrong!');
      }
    }

    console.log("\nDon't upload downloaded item(s) for public access");
    console.log('Use it for yourself only');
    console.log('Thanks!');
  }

  private async watch(downloadService: DownloadService, id: string): Promise<void> {
    const sleep = (duration: number) => new Promise<string>((resolve) => setTimeout(() => resolve('next'), duration));
    const progress: number = downloadService.calcDownloadProgress(id);

    if (progress <= 100) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}%`);
      if (progress !== 100) {
        await sleep(1000);
        await this.watch(downloadService, id);
        return;
      }
    }

    process.stdout.write('\n');
    console.log(`Item downloaded: ${downloadService.itemFile(id)}`);
  }

}

const absolutePath: string = join(__dirname, '..');
new FilimoPlusCli(absolutePath).main(process.argv.slice(2));

export { absolutePath };
