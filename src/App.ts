import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './Auth/AuthService';
import { ClientService } from './Client/ClientService';
import { DomService } from './Dom/DomService';
import { DownloadService } from './Download/DownloadService';
import { ReadlineService } from './Readline/ReadlineService';

class App {

  static wait(duration: number): Promise<string> {
    return new Promise<string>((resolve) => setTimeout(() => resolve('next'), duration));
  }

  async main(): Promise<void> {
    const packageJson: any = JSON.parse(readFileSync(join(process.cwd(), 'package.json')).toString());
    console.log(`${packageJson.name} v${packageJson.version}`);
    console.log(`Author: ${packageJson.author.name}`);

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

    await this.download();
  }

  private async download(): Promise<void> {
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

    const id: string = await ReadlineService.question('Enter id:');
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
      await this.watch(download.id);
    }
  }

  private async watch(id: string): Promise<void> {
    const progress: number = DownloadService.calcDownloadProgress(id);
    if (progress <= 100) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}%`);
      if (progress !== 100) {
        await App.wait(1000);
        await this.watch(id);
        return;
      }
    }
    process.stdout.write('\n');
    console.log(`Item "${id}" downloaded`);
    console.log("Don't upload this file for public access");
    console.log('Use it for yourself only');
    console.log('Thanks!');
  }

}

new App().main();
