import { ClientService } from '../Client/ClientService';
import { IDownload, IDownloadTrack, IDownloadVariant } from './DomInterface';

export class DomService {

  constructor(
    private clientService: ClientService
  ) {
  }

  async getPage(url: string): Promise<string> {
    const data = await this.clientService.sendRequest(url);
    return data.responseBody.toString();
  }

  async getUserName(): Promise<string | undefined> {
    const html: string = await this.getPage('https://www.filimo.com');
    const username = [...html.matchAll(/user\.username='(.*)';uxEvents\.user\.name/g)]
      .map((i) => i[1])
      .pop();
    return username ? username : undefined;
  }

  async getDownload(id: string): Promise<IDownload> {
    let name = '';
    const html: string = await this.getPage(`https://www.filimo.com/w/${id}`);
    const titleMatches = html.match(/<title[^>]*>([^<]+)<\/title>/);
    if (titleMatches) {
      name = titleMatches[1].trim();
    }

    const strObj = [...html.matchAll(/var player_data=(.*);if/g)].map((i) => i[1]).pop();
    const playerData = JSON.parse(strObj!);

    let playlistUrl = '';
    const multiSRC = playerData.multiSRC || [];
    multiSRC.forEach((item: any) => {
      item.forEach((source: any) => {
        if (!playlistUrl && source.type === 'application/vnd.apple.mpegurl') {
          playlistUrl = source.src;
        }
      });
    });

    const playlist = await this.getPage(playlistUrl);

    const variants: IDownloadVariant[] = [
      ...playlist.matchAll(/#([0-9]+(.*?))\n(.*)RESOLUTION=(.*)\n(.*)/g),
    ].map((variant) => {
      return {
        quality: variant[1] || '',
        resolution: variant[4] ? variant[4].split(',')[0] : '',
        link: variant[5] || '',
      } as IDownloadVariant;
    });

    const tracks: IDownloadTrack[] = [
      ...playlist.matchAll(/GROUP-ID="audio",LANGUAGE="(.*)",NAME(.*)URI="(.*)"/g),
    ].slice(0, 2).map((i) => {
      return {
        language: i[1],
        link: i[3]
      }
    });

    let subtitle: string | null = null;
    (playerData.tracks || []).forEach((track: any) => {
      if (!subtitle && track.srclang === 'fa') {
        subtitle = track.src;
      }
    });

    return {
      id,
      name,
      variants,
      tracks,
      subtitle
    };
  }

}
