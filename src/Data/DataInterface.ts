export interface IDownloadSubtitle {
  language: string;
  link: string;
}

export interface IDownloadVariant {
  quality: string;
  resolution: string;
  link: string;
}

export interface IDownloadTrack {
  language: string;
  link: string;
}

export interface IWatch {
  id: string;
  name: string;
  playlist: string;
  subtitles: IDownloadSubtitle[];
}

export interface IDownload extends IWatch {
  variants: IDownloadVariant[];
  tracks: IDownloadTrack[];
}
