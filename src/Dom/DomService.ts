import { ClientService } from '../Client/ClientService';
import { IDownload, IDownloadSubtitle, IDownloadTrack, IDownloadVariant } from './DomInterface';
import { specialChars } from './SpecialChars';
import { specialSymbols } from './SpecialSymbols';

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
    const username = [...html.matchAll(/profile_edit_text.*>(.*)</g)]
      .map((i) => i[1])
      .pop();
    return username ? username : undefined;
  }

  async getDownload(id: string): Promise<IDownload> {
    const toRemove: string[] = ['\r', '&zwnj;', ...specialChars, ...specialSymbols];

    let name = '';
    const html: string = await this.getPage(`https://www.filimo.com/w/${id}`);
    const titleMatches = html.match(/<title[^>]*>([^<]+)<\/title>/);
    if (titleMatches) {
      name = titleMatches[1].trim();
    }

    let lines: string[] = html.split('\n');
    const startScriptIndex: number = lines.findIndex((line: string) => line.includes('var player_data'));
    lines = lines.slice(startScriptIndex, lines.length);
    const endScriptIndex: number = lines.findIndex((line: string) => line.includes('</script>'));
    lines = lines.slice(0, endScriptIndex + 1);
    let script: string = lines.join('');
    toRemove.forEach(rm => script = script.replaceAll(rm, ''));

    const strObj = [...script.matchAll(/var player_data=(.*?);/g)].map((i) => i[1]).pop();
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
      ...playlist.matchAll(/#(\d+(.*?))\n(.*)RESOLUTION=(.*)\n(.*)/g),
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

    const subtitles: IDownloadSubtitle[] = [];
    (playerData.tracks || []).forEach((track: any) => {
      subtitles.push({
        language: track.srclang.toLowerCase(),
        link: track.src
      });
    });

    return {
      id,
      name,
      variants,
      tracks,
      subtitles
    };
  }

}
