import { Dictionary, HttpHeaders, HttpMethod, IXhr } from './interfaces';

const json = 'application/json';
const DEFAULT_TIMEOUT = 190000;
const POLL_INTERVAL = 25;

export function Xhr(
  newXMLHTTPRequest?: () => XMLHttpRequest,
  defaultTimeout = DEFAULT_TIMEOUT,
  pollInterval = POLL_INTERVAL,
): IXhr {
  return XhrConstructor(newXMLHTTPRequest as any, defaultTimeout, pollInterval);
}

function XhrConstructor(
  this: any, 
  newXMLHTTPRequest: () => XMLHttpRequest,
  defaultTimeout: number,
  pollInterval: number,
) {
  let XHRReq = newXMLHTTPRequest;
  // ensure object constructor
  if (!(this instanceof XhrConstructor)) {
    return new (<any>XhrConstructor)(newXMLHTTPRequest, defaultTimeout, pollInterval);
  }

  const that = this;
  /** @dict */
  const defaultHttpHeaders = Object.create(null);

  init();

  /**
   * @param {string} key
   * @param {string=} value
   * @returns {Object}
   */
  function defaultHeader(key: string, value?: string): HttpHeaders {
    if (!key) {
      return defaultHttpHeaders;
    }

    if (!value) {
      if (defaultHttpHeaders[key]) {
        delete defaultHttpHeaders[key];
      }
    } else {
      if (typeof value === 'string') {
        defaultHttpHeaders[key] = value;
      } else {
        defaultHttpHeaders[key] = value + '';
      }
    }

    return defaultHttpHeaders;
  }

  /**
   * @param {XMLHttpRequest} xhr
   */
  function setDefaultHttpHeaders(xhr: XMLHttpRequest) {
    Object.keys(defaultHttpHeaders)
      .forEach((attr) => xhr.setRequestHeader(attr, defaultHttpHeaders[attr]));
  }

  /**
   * @param {XMLHttpRequest} xhr
   * @param {Object} localHttpHeaders
   */
  function setHttpHeaders(xhr: XMLHttpRequest, localHttpHeaders: HttpHeaders) {
    setDefaultHttpHeaders(xhr);

    Object.keys(localHttpHeaders).forEach((attr) => {
      xhr.setRequestHeader(attr, localHttpHeaders[attr] + '');
    });
  }

  /**
   * @param {string} method
   * @param {string} url
   * @param {Object=} queryObj
   * @param {Object=} data
   * @param {string=} mimeType
   * @param {Object=} headers
   * @returns {Promise<string>}
   */
  function newRequest(
    method: HttpMethod,
    url: string,
    queryObj: Dictionary<any>,
    data: Dictionary<any>,
    mimeType: string,
    headers: HttpHeaders
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const finalMimeType = (mimeType === undefined) ? json : mimeType;
      const parsedQuery = parseQuery(queryObj);
      const finalUrl = parsedQuery ? url + parsedQuery : url;
      const xhr = (XHRReq as any)();
      let timer: any;

      if ((method === 'POST') || (method === 'PUT')) {
        if (!data) {
          reject(new Error(
            'xhr: newRequest: ' + method + ': requires data')
          );
          return;
        }
      }

      function clearTimer() {
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
      }

      /**
       * @param {Error} reason
       */
      function onerror(reason: Error) {
        reject(reason);
        clearTimer();
      }

      function onload() {
        // if the document isn't ready try again later
        if (+xhr.readyState !== 4) {
          setTimeout(onload, pollInterval);
          return;
        }

        // if the header has a 200, or 201 status handle it
        if ((xhr.status === 200) || (xhr.status === 201)) {
          resolve(xhr.responseText);
          clearTimer();
          return;
        }

        // otherwise error/unexpected
        onerror(new Error(`xhr: non 200 status: ${xhr.status}`));
      }

      try {
        /** @type {function(...)} */
        xhr.onload = onload;
        /** @type {function(...)} */
        xhr.onerror = onerror;
        xhr.open(method, finalUrl, true);
        xhr.setRequestHeader('Content-Type', finalMimeType);
        if ((headers) && (typeof headers === 'object')) {
          setHttpHeaders(xhr, headers);
        } else {
          setDefaultHttpHeaders(xhr);
        }

        if (!data) {
          xhr.send();
        } else {
          xhr.send(JSON.stringify(data));
        }
      } catch (e) {
        onerror(e);
        return;
      }

      timer = setTimeout(() => {
        if (xhr.abort) {
          xhr.abort();
        }
        onerror(new Error('xhr: request timed out'));
      }, defaultTimeout);
    });
  }

  /**
   * initialize the object
   */
  function init() {
    XHRReq = typeof newXMLHTTPRequest === 'function' ?
      newXMLHTTPRequest :
      () => new XMLHttpRequest();
    that['defaultHeader'] = defaultHeader;
    that['newRequest'] = newRequest;
  }
}

/**
 * @param {string} url
 * @param {Object=} queryObj
 * @param {Object=} headers
 * @returns {Promise<string>}
 */
XhrConstructor.prototype['get'] = function get(
  url: string, queryObj?: Dictionary<any>, headers?: HttpHeaders
) {
  return this['newRequest'](
    'GET', url, queryObj, undefined, undefined, headers
  );
};

/**
 * @param {string} url
 * @param {Object=} data
 * @param {Object=} queryObj
 * @param {Object=} headers
 * @returns {Promise<string>}
 */
XhrConstructor.prototype['put'] = function put(
  url: string,
  data?: Dictionary<any>,
  queryObj?: Dictionary<any>,
  headers?: HttpHeaders
) {
  return this['newRequest']('PUT', url, queryObj, data, undefined, headers);
};

/**
 * @param {string} url
 * @param {Object=} data
 * @param {Object=} queryObj
 * @param {Object=} headers
 * @returns {Promise<string>}
 */
XhrConstructor.prototype['post'] = function post(
  url: string,
  data?: Dictionary<any>,
  queryObj?: Dictionary<any>,
  headers?: HttpHeaders
) {
  return this['newRequest']('POST', url, queryObj, data, undefined, headers);
};

/**
 * @param {Object=} query
 * @returns {string|boolean}
 */
export function parseQuery(query?: Dictionary<any>): string | boolean {
  if (!query) {
    return false;
  }

  if (typeof query !== 'object') {
    return false;
  }

  let rString = '?';

  Object.keys(query).forEach((i, j) => {
    if (j !== 0) {
      rString += '&';
    }
    rString += [i, '=', encodeURIComponent(query[i])].join('');
  });

  return rString;
}
