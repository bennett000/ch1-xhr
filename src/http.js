/**
 * Created by michael on 23/05/14.
 */
/*global SimpleFakePromise */

function HTTP(newXMLHTTPRequest) {
    'use strict';

    // ensure object constructor
    if (!(this instanceof HTTP)) {
        return new HTTP(newXMLHTTPRequest);
    }

    var that = this,
        log,
        Q = new SimpleFakePromise(),
        /** @dict */
        consts = Object.freeze({
            json: 'application/json',
            noop: function () {}
        }),
        defaultHeaders = Object.create(null),
        /** @type Array.<function(...)> */
        noAccessHooks = [],
        /** @type {number} */
        defaultTimeout = 190000;

    /*global console*/
    if (typeof console !== 'undefined') {
        log = console;
    } else {
        log = {
            log : consts.noop,
            info: consts.noop,
            warn: consts.noop,
            error: consts.noop,
            assert: consts.noop
        };
    }

    /**
     * @param fn {function (...)}
     * @returns {boolean}
     */
    function isFunction (fn) {
        return typeof fn === 'function';
    }

    /**
     * upgrades the logger
     * @param newLog
     */
    function setLogger (newLog) {
        if (isFunction(newLog.log) && isFunction(newLog.info) && isFunction(newLog.warn) && isFunction(newLog.error) && isFunction(newLog.assert)) {
            Object.keys(newLog).forEach(function (newLogAttr) {
                log[newLogAttr] = newLog[newLogAttr];
            });
        }
    }

    /**
     * Sets JS RPC to use promises instead of callbacks, using the given promise
     * library
     * @param lib {Object} a promise library like Q
     * @returns {boolean}
     *
     * Promise library must support:
     * lib.defer()
     * lib.defer().resolve()
     * lib.defer().reject()
     * lib.defer().promise
     * lib.defer().promise.then()
     */
    function setPromiseLib(lib) {
        if (!isFunction(lib.defer)) {
            throw new TypeError('RPC: setPromiseLib: expecting a library with a root level defer function');
        }
        var test = lib.defer();

        if (!isFunction(test.resolve)) {
            throw new TypeError('RPC: setPromiseLib: expecting defers to have a resolve method');
        }

        if (!isFunction(test.reject)) {
            throw new TypeError('RPC: setPromiseLib: expecting defers to have a reject method');
        }

        if (!test.promise) {
            throw new TypeError('RPC: setPromiseLib: expecting defer objects to have a promise');
        }

        if (!isFunction(test.promise.then)) {
            throw new TypeError('RPC: setPromiseLib: expecting promises to have a then method');
        }

        HTTP.prototype['Q'] = lib;
        return true;
    }



    /**
     * adds a default header to be used on http requests
     * @param key
     * @param value
     * @returns {boolean}
     */
    function defaultHeader(key, value) {
        if (!key) {
            return defaultHeaders;
        }
        if ((typeof key !== 'string') && (typeof key !== 'string')) {
            return false;
        }
        if (value === '') {
            if (defaultHeaders[key]) {
                delete defaultHeaders[key];
            }
        } else {
            defaultHeaders[key] = value;
        }
        return true;
    }

    /**
     *
     * @param fn (function (...))
     */
    function addNoAccess(fn) {
        if (!isFunction(fn)) {
            return false;
        }
        noAccessHooks.push(fn);
        return true;
    }

    /**
     * triggers the items in noAccess
     */
    function onNoAccess() {
        noAccessHooks.forEach(function (hook) {
            try {
                hook();
            } catch (err) {
                // fail silent
            }
        });
    }

    /**
     * assigns the default headers to an xhr object
     * @param xhr {Object}
     */
    function setDefaultHeaders(xhr) {
        Object.keys(defaultHeaders).forEach(function (attr) {
            xhr.setRequestHeader(attr, defaultHeaders[attr]);
        });
    }

    function setHeaders(xhr, localHeaders) {
        setDefaultHeaders(xhr);

        Object.keys(localHeaders).forEach(function (attr) {
            if (typeof localHeaders[attr] !== 'string') {
                localHeaders[attr] = localHeaders[attr].toString();
            }
            xhr.setRequestHeader(attr, localHeaders[attr]);
        });
    }


    /**
     *
     * @param method {string}
     * @param url {string}
     * @param queryObj {Object=}
     * @param data {*}
     * @param mimeType {string=}
     * @returns {*}
     */
    function newRequest(method, url, queryObj, data, mimeType, headers) {
        mimeType = (mimeType === undefined) ? consts.json : mimeType;
        queryObj = that.parseQuery(queryObj);
        if (queryObj !== false) {
            url += queryObj;
        }

        /** @type {!Object} */
        var xhr = newXMLHTTPRequest(),
        /** @type {!Object} */
        deferred = Q.defer(),
        timer = false;

        if ((method === 'POST') || (method === 'PUT')) {
            if (!data) {
                deferred.reject(new Error('http: newRequest: ' + method + ': has falsy data'));
                return deferred.promise;
            }
        }

        function clearTimer() {
            if (timer !== false) {
                clearTimeout(timer);
                timer = false;
            }
        }

        function onerror(reason) {
            reason = (reason === undefined) ? 'fatal error' : reason;

            deferred.reject(new Error(['http',
                                          reason,
                                          JSON.stringify(url)].join(':')));
            clearTimer();
        }

        function onload() {
            // if the document isn't ready try again later
            if (+xhr.readyState !== 4) {
                return setTimeout(onload, 25);
            }
            // if the header has a 200, or 201 status handle it
            if ((xhr.status === 200) || (xhr.status === 201)) {
                deferred.resolve(xhr.responseText);
                clearTimer();
                return;
            }
            // if the header has a 400/401 status trip the logout flag
            if (( xhr.status === 401) || (xhr.status === 400)) {
                onNoAccess();
            }
            // otherwise error/unexpected
            onerror('status code');
        }

        function onprogress(readyState) {
            if (readyState) {
                if (readyState.lengthComputable) {
                    deferred.notify(readyState);
                }
            }
        }

        try {
            /** @type {function(...)} */
            xhr.onload = onload;
            /** @type {function(...)} */
            xhr.onerror = function (e) {
                onerror('http error ' + e.message);
            };
            /** @type {function(...)} */
            xhr.onprogress = onprogress;

            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', mimeType);
            setHeaders(xhr, headers);
            /*
            if (xsrf !== undefined) {
                xhr.setRequestHeader('X-XSRF-TOKEN', xsrf);
            }
            if (bearer !== undefined) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + bearer);
            }*/

            if ((data === null) ||
                (data === false) ||
                (data === undefined)) {
                xhr.send();
            } else {
                xhr.send(JSON.stringify(data));
            }
        } catch (e) {
            onerror('unhandled exception ' + e.message);
            return deferred.promise;
        }

        timer = setTimeout(function () {
            var errorstr = 'request timed out';
            try {
                xhr.abort();
            } catch (err) {
                errorstr = err.message;
            } finally {
                onerror(errorstr);
            }
        }, defaultTimeout);

        return deferred.promise;
    }

    /**
     * expose the api
     */
    function expose() {
        that['setLogger'] = setLogger;
        that['setPromiseLib'] = setPromiseLib;
        that['defaultHeader'] = defaultHeader;
        that['onNoAccess'] = addNoAccess;
        that['newRequest'] = newRequest;
        that['log'] = log;
    }

    /**
     * initialize the object
     */
    function init () {
        newXMLHTTPRequest = typeof newXMLHTTPRequest === 'function' ? newXMLHTTPRequest : function () {
            return new XMLHttpRequest(Array.prototype.slice.call(arguments, 0));
        };
        expose();
    }
    init();
}

/**
 * @param {string} url
 * @param {Object=} queryObj
 * @param {Object=} headers
 *
 * @return {!Object}
 */
HTTP.prototype['get'] = function get(url, queryObj, headers) {
    'use strict';
    return this.newRequest('GET', url, queryObj, undefined, undefined, headers);
};

/**
* @param {string} url
* @param {*} data
* @param {Object=} queryObj
* @param {Object=} headers
*
* @return {!Object}
*/
HTTP.prototype['put'] = function put(url, data, queryObj, headers) {
    'use strict';
    return this.newRequest('PUT', url, queryObj, data, undefined, headers);
};

/**
* @param {string} url
* @param {*} data
* @param {!Object=} queryObj
*
* @return {!Object}
*/
HTTP.prototype['post'] = function post(url, data, queryObj, headers) {
    'use strict';
    return this.newRequest('POST', url, queryObj, data, undefined, headers);
};

/**
 * @param {string=} query
 *
 * @return {string|boolean}
 */
HTTP.prototype['parseQuery'] = function parseQuery(query) {
    'use strict';

    if (!query) {
        return false;
    }

    if (typeof query !== 'object') {
        return false;
    }

    var j = 0, rString = '?';

    try {

        Object.keys(query).forEach(function (i) {
            if (j !== 0) {
                rString += '&';
            }
            j += 1;
            rString += [i, '=', encodeURIComponent(query[i])].join('');
        });
    } catch (err) {
        this.log.warn('http: parseQuery: ' + err.message);
        return '';
    }
    return rString;
};

HTTP.prototype['Q'] = new SimpleFakePromise();
