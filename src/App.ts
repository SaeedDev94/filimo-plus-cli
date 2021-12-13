#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './Auth/AuthService';
import { ClientService } from './Client/ClientService';
import { DomService } from './Dom/DomService';
import { DownloadService } from './Download/DownloadService';
import { ReadlineService } from './Readline/ReadlineService';

class App {

  constructor(
    private absolutePath: string
  ) {
    this.packageJson = JSON.parse(readFileSync(join(this.absolutePath, 'package.json')).toString());
  }

  private packageJson: {
    name: string,
    version: string,
    author: {
      name: string,
      email: string,
      url: string
    }
  };

  async main(args: string[]): Promise<void> {
    if (['win32', 'linux'].indexOf(process.platform) === -1) {
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
    console.log(`${this.packageJson.name} v${this.packageJson.version}`);
  }

  private printAuthor(): void {
    console.log(`Author: ${this.packageJson.author.name}`);
  }

  private static wait(duration: number): Promise<string> {
    return new Promise<string>((resolve) => setTimeout(() => resolve('next'), duration));
  }

  private async download(itemId?: string): Promise<void> {
    let id: string | undefined = itemId;

    const authService = new AuthService();
    const userAgent: string = authService.getUserAgent();
    let authToken: string | null = authService.getToken();

    const clientService = new ClientService(userAgent, authToken);

    if (!authToken) {
      console.log("You don't have auth token");
      const token = await ReadlineService.question('Enter auth token:');
      if (!token) {
        console.error('No token!');
        return;
      }
      authToken = token;
      clientService.setToken(authToken);
      authService.saveToken(authToken);
    }

    const domService = new DomService(clientService);

    console.log('Check auth token ...');
    const userName = await domService.getUserName();
    if (!userName) {
      console.error('Invalid auth token');
      console.log('Deleting auth token ...');
      authService.deleteToken();
      console.log('Auth token deleted');
      console.log('Please try again!');
      return;
    }
    console.log(`UserName: ${userName}`);

    if (!id) id = await ReadlineService.question('Enter id:');
    console.log(`Getting "${id}" info ...`);
    const download = await domService.getDownload(id);
    console.log(`Name: "${download.name}"`);

    let selectedVariant: string = '';
    if (download.variants.length === 1) selectedVariant = download.variants[0].link;
    if (download.variants.length >= 2) {
      const variant: string = await ReadlineService.question(
        'Select a variant:',
        download.variants.map((item) => `${item.resolution} - ${item.quality}`)
      );
      selectedVariant = download.variants[Number(variant) - 1].link;
    }

    let selectedTrack: string | null = null;
    if (download.tracks.length === 1) selectedTrack = download.tracks[0].link;
    if (download.tracks.length >= 2) {
      const track: string = await ReadlineService.question(
        'Select an audio track:',
        download.tracks.map((item) => item.language)
      );
      selectedTrack = download.tracks[Number(track) - 1].link;
    }

    const downloadService = new DownloadService(clientService);
    console.log('Starting download ...');
    const success = await downloadService.start(download, selectedVariant, selectedTrack);
    if (success) {
      console.log('Download started:');
      await this.watch(downloadService, download.id);
    }
  }

  private async watch(downloadService: DownloadService, id: string): Promise<void> {
    const progress: number = downloadService.calcDownloadProgress(id);
    if (progress <= 100) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}%`);
      if (progress !== 100) {
        await App.wait(1000);
        await this.watch(downloadService, id);
        return;
      }
    }
    process.stdout.write('\n');

    const downloadDir: string = join(downloadService.movieDir, id);
    const movieFile: string = join(downloadDir, `${id}.mp4`);

    console.log(`Item downloaded: ${movieFile}`);
    console.log("Don't upload this file for public access");
    console.log('Use it for yourself only');
    console.log('Thanks!');
  }

}

const absolutePath: string = join(__dirname, '..');
new App(absolutePath).main(process.argv.slice(2));

export { absolutePath };
