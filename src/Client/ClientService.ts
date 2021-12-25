import {
  ClientRequest,
  OutgoingHttpHeaders,
  IncomingMessage
} from 'http';
import { request } from 'https';
import { AuthService } from '../Auth/AuthService';
import { IHttpResponse } from './ClientInterface';

export class ClientService {

  constructor(
    private authService: AuthService
  ) {
  }

  sendRequest(url: string, method: string = 'GET', data: any = null): Promise<IHttpResponse> {
    const reqExecutor = (resolve: (value: IHttpResponse) => void, reject: (value: IHttpResponse) => void): void => {

      const userAgent: string = this.authService.getUserAgent();
      const authToken: string | null = this.authService.getToken();

      const headers: OutgoingHttpHeaders = { 'User-Agent': userAgent };
      if (authToken) headers['Cookie'] = `AuthV1=${authToken}`;

      const clientRequest: ClientRequest = request(url, {
        method,
        headers
      });

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
