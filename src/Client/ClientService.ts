import {
  ClientRequest,
  OutgoingHttpHeaders,
  IncomingMessage
} from 'http';
import {
  request,
  RequestOptions
} from 'https';
import { IHttpResponse } from './ClientInterface';

export class ClientService {

  constructor(
    private userAgent: string,
    private authToken: string | null
  ) {
  }

  setToken(value: string): void {
    this.authToken = value;
  }

  sendRequest(url: string, argOptions: RequestOptions = {}, data: any = null): Promise<IHttpResponse> {
    const reqExecutor = (resolve: (value: IHttpResponse) => void, reject: (value: IHttpResponse) => void): void => {

      const headers: OutgoingHttpHeaders = {
        'user-agent': this.userAgent
      };
      if (this.authToken) headers['cookie'] = `AuthV1=${this.authToken};`;

      const defaultOptions: RequestOptions = {
        method: 'GET',
        headers
      };
      const options: RequestOptions = Object.assign<RequestOptions, RequestOptions>(defaultOptions, argOptions);

      const clientRequest: ClientRequest = request(url, options);

      clientRequest.on('response', (response: IncomingMessage) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const data: IHttpResponse = {
            headers: response.headers,
            statusCode: response.statusCode,
            responseBody: Buffer.concat(chunks)
          };
          if (response.statusCode === 200) resolve(data);
          else reject(data);
        });
      });

      if (data) clientRequest.write(data);
      clientRequest.end();

    };

    return new Promise<IHttpResponse>(reqExecutor);
  }

}
