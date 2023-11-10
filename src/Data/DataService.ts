import { ClientService } from '../Client/ClientService';
import { IDownload, IWatch } from './DataInterface';

export class DataService {

  constructor(
    private clientService: ClientService,
  ) {
  }

  async getDownload(id: string): Promise<IDownload> {
    const watch = await this.getWatch(id);
    const data = await this.clientService.sendRequest(watch.playlist);
    const playlist = data.responseBody.toString();

    return {
      ...watch,
      variants: [
        ...playlist.matchAll(/#(\d+(.*?))\n(.*)RESOLUTION=(.*)\n(.*)/g),
      ].map((variant) => {
        return {
          quality: variant[1] || '',
          resolution: variant[4] ? variant[4].split(',')[0] : '',
          link: variant[5] || '',
        };
      }),
      tracks: [
        ...playlist.matchAll(/GROUP-ID="audio",LANGUAGE="(.*)",NAME(.*)URI="(.*)"/g),
      ].slice(0, 2).map((i) => {
        return {
          language: i[1],
          link: i[3],
        };
      }),
    };
  }

  private async getWatch(id: string): Promise<IWatch> {
    const data = await this.clientService.sendRequest(`https://api.filimo.com/api/fa/v1/movie/watch/watch/uid/${id}`);
    const res = JSON.parse(data.responseBody.toString());
    const attributes = res.data.attributes ?? {};
    const info = attributes['info'] ?? {};

    return {
      id,
      name: info?.text ?? '',
      playlist: (attributes['multiSRC'] ?? []).reduce((carry: string, multiSRC: any[]) => {
        const source = multiSRC.find((source: any) => source.type === 'application/vnd.apple.mpegurl');
        if (!carry && !!source) carry = source.src;
        return carry;
      }, ''),
      subtitles: (attributes['tracks'] ?? []).map((subtitle: any) => {
        return {
          language: subtitle.srclang.toLowerCase(),
          link: subtitle.src,
        };
      }),
    };
  }

}
