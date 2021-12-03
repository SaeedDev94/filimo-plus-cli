import { AxiosInstance, default as axios } from 'axios';

export class ClientService {

  constructor(
    private userAgent: string,
    private authToken: string | null
  ) {
  }

  setToken(value: string): void {
    this.authToken = value;
  }

  getInstance(): AxiosInstance {
    const headers: any = { 'user-agent': this.userAgent };
    if (this.authToken) headers['cookie'] = `AuthV1=${this.authToken};`;
    const client = axios;
    return client.create({ headers });
  }

}
