export interface IDownloadVariant {
  quality: string;
  resolution: string;
  link: string;
}

export interface IDownloadTrack {
  language: string;
  link: string;
}

export interface IDownload {
  id: string;
  name: string;
  variants: IDownloadVariant[];
  tracks: IDownloadTrack[];
  subtitle: string | null;
}
