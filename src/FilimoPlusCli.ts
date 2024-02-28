#!/usr/bin/env node

import { ChildProcess, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './Auth/AuthService';
import { ClientService } from './Client/ClientService';
import { IDownload, IDownloadTrack, IDownloadVariant } from './Data/DataInterface';
import { DataService } from './Data/DataService';
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

  private args = new Map<string, string|undefined>();
  private processes = new Map<string, ChildProcess>();
  private sleep = (duration: number) => new Promise<string>((resolve) => setTimeout(() => resolve('next'), duration));

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

    args.forEach((arg) => {
      const parts = arg.split('=');
      const key = parts.shift();
      const value = parts.shift();
      this.args.set(key!, value);
    });

    if (this.args.has('--version')) {
      this.printVersion();
      return;
    }

    if (this.args.has('--author')) {
      this.printAuthor();
      return;
    }

    this.printVersion();
    this.printAuthor();

    await this.download(this.args.get('--id'));
  }

  private printVersion(): void {
    console.log(`${this.package.name} v${this.package.version}`);
  }

  private printAuthor(): void {
    console.log(`Author: ${this.package.author.name}`);
  }

  private async download(itemId?: string): Promise<void> {
    let id: string | undefined = itemId;

    const authService: AuthService = new AuthService(this.absolutePath);
    const clientService: ClientService = new ClientService(authService);
    const domService: DataService = new DataService(clientService);

    if (!authService.getToken()) {
      console.log("You don't have auth token");
      const token = await ReadlineService.question('Enter auth token:');
      if (!token) throw new Error('No token!');
      authService.saveToken(token);
    }

    console.log('Check auth token ...');
    const userName = await authService.getUserName();
    if (userName) {
      console.log(`UserName: ${userName}`);
    } else {
      authService.deleteToken();
      throw new Error('Invalid auth token');
    }

    if (!id) id = await ReadlineService.question('Enter id:');
    if (!id) throw new Error('No id!');

    let download: IDownload;
    try {
      console.log(`Getting "${id}" info ...`);
      download = await domService.getDownload(id);
      console.log(`Name: "${download.name}"`);
    } catch (res: any) {
      throw new Error(`Invalid id: "${id}", statusCode: "${res?.statusCode}"`);
    }

    if (!download.variants.length) {
      throw new Error('No quality variant found!');
    }

    let variants: IDownloadVariant[] = [];
    const variantOptions: string[] = download.variants.map((item) => `${item.resolution} - ${item.quality}`);
    if (download.variants.length === 1) {
      variants = download.variants;
      console.log(`Select "${variantOptions[0]}" quality variant by default`);
    }
    if (download.variants.length >= 2) {
      const selectedVariants: string = await ReadlineService.question(
        'Select quality variants: [comma separated]',
        variantOptions
      );
      selectedVariants.split(',').forEach((selected: string) => {
        const index: number = Number(selected) - 1;
        if (Number.isNaN(index) || !download.variants[index]) throw new Error(`Invalid quality variant: "${selected}"`);
        variants.push(download.variants[index]);
      });
    }

    let track: IDownloadTrack | undefined = undefined;
    const trackOptions: string[] = download.tracks.map((item) => item.language.toUpperCase());
    if (download.tracks.length === 1) {
      track = download.tracks[0];
      console.log(`Select "${trackOptions[0]}" audio track by default`);
    }
    if (download.tracks.length >= 2) {
      const selected: string = await ReadlineService.question(
        'Select an audio track:',
        trackOptions
      );
      const index: number = Number(selected) - 1;
      if (Number.isNaN(index) || !download.tracks[index]) throw new Error(`Invalid audio track: "${selected}"`);
      track = download.tracks[index];
    }

    for (let i = 0 ; i < variants.length ; i++) {
      const variant: IDownloadVariant = variants[i];
      const downloadService: DownloadService = new DownloadService(authService, clientService, variant.quality, this.absolutePath);
      console.log(`[${variant.quality}]`);
      try {
        const downloadProcess: ChildProcess = await downloadService.start(download, variant.link, track?.link);
        downloadProcess.on('close', () => this.processes.delete(variant.link));
        this.processes.set(variant.link, downloadProcess);
        console.log('Downloading:');
        await this.watch(downloadService, download, variant);
      } catch (exception) {
        console.error('Oops!', exception);
        throw new Error('Somethings went wrong!');
      }
    }

    console.log("\nDon't upload downloaded item(s) for public access");
    console.log('Use it for yourself only');
    console.log('Thanks!');
  }

  private async watch(downloadService: DownloadService, download: IDownload, variant: IDownloadVariant): Promise<void> {
    const progress: number = downloadService.calcDownloadProgress(download.id);

    if (this.processes.get(variant.link)) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}%`);
      await this.sleep(1000);
      await this.watch(downloadService, download, variant);
      return;
    }

    if (progress !== 100) {
      throw new Error(`download [item: ${download.id}, quality: ${variant.quality}] was incomplete, last progress: ${progress}%`);
    }

    process.stdout.write('\n');
    console.log(`Item downloaded: ${downloadService.itemFile(download.id)}`);
  }

}

new FilimoPlusCli(join(__dirname, '..'))
  .main(process.argv.slice(2))
  .catch((error: Error) => console.log(error.message));
