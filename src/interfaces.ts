import { Dictionary } from '@ch1/utility';
export { Dictionary } from '@ch1/utility';

export type HttpHeaders = Dictionary<string>;
export type HttpMethod = 'DELETE' | 'GET' | 'POST' | 'PUT';

export interface IXhr {
  defaultHeader(key: string, value?: string): HttpHeaders;
  get(
    url: string, queryObj?: Dictionary<any>, headers?: HttpHeaders
  ): Promise<string>;
  newRequest(
    method: HttpMethod,
    url: string,
    queryObj?: Dictionary<any>,
    data?: Dictionary<any>,
    mimeType?: string,
    headers?: HttpHeaders
  ): Promise<string>;
  post(
    url: string,
    data?: Dictionary<any>,
    queryObj?: Dictionary<any>,
    headers?: HttpHeaders
  ): Promise<string>;
  put(
    url: string,
    data?: Dictionary<any>,
    queryObj?: Dictionary<any>,
    headers?: HttpHeaders
  ): Promise<string>;
}