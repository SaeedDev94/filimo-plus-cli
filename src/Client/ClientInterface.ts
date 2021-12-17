import { IncomingHttpHeaders } from 'http';

export interface IHttpResponse {
  headers: IncomingHttpHeaders;
  statusCode: number | undefined;
  responseBody: Buffer;
}
