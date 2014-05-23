/*global workular, initLog */

workular.module('js-http', []).factory('stringsHTTP', [function () {
    'use strict';

    /** @type {Object} */
    var S = Object.create(null);

    /** @type {string} */
    S['self'] = 'HOMER.http';
    /** @type {string} */
    S['query'] = '?';
    /** @type {string} */
    S['concat'] = '&';
    /** @type {string} */
    S['assign'] = '=';
    /** @type {string} */
    S['fnOnload'] = 'onload';
    /** @type {string} */
    S['fnOnerror'] = 'onerror';
    /** @type {string} */
    S['fnOnprogress'] = 'onprogress';
    /** @type {string} */
    S['status'] = 'status code';
    /** @type {string} */
    S['timeout'] = 'request timed out';
    /** @type {string} */
    S['mimeJSON'] = 'application/json';
    /** @type {string} */
    S['headerContent'] = 'Content-Type';
    /** @type {string} */
    S['get'] = 'GET';
    /** @type {string} */
    S['put'] = 'PUT';
    /** @type {string} */
    S['post'] = 'POST';
    /** @type {string} */
    S['Object'] = 'object';
    /** @type {string} */
    S['dirSlash'] = '/';

    /** @const */
    Object.freeze(S);

    return S;
}]).factory('newXMLHttpRequest', ['global', function () {
    'use strict';
    /**
     * allows for XHR mocks
     *
     * @return {!Object}
     */
    function newXMLHttpRequest() {
        return new XMLHttpRequest();
    }

    return newXMLHttpRequest;
}]).factory('http', ['q', 'stringsHTTP', 'log', function (Q, S, log) {
    'use strict';

    /** @dict */
    var E, http,
        /** @type {number} */
        preHookCap = 30000,
        /** @type {number} */
        preHookInitDelay = 500,
        /** @type {number} */
        preHookDelay = 500,
        /** @type {number} */
        preHookRate = 1.5,
        /** @type {Array.<Object>} */
        preHooks = [],
        /** @type {number} */
        defaultTimeout = 190000;

    E = E === undefined ? {
        delim: ' : ',
        fatal: ' fatal ',
        remoteData: ' remoteData ',
        unhandled: ' unhandled'
    } : E;

    /**
     * @param {string=} query
     *
     * @return {string}
     */
    function parseQuery(query) {
        if ((query === undefined) || (query === false) || (query === null)) {
            return false;
        }

        if (typeof query !== 'object') {
            return false;
        }

        var j = 0, rString = S.query;

        try {

            Object.keys(query).forEach(function (i) {
                if (j !== 0) {
                    rString += S.concat;
                }
                j += 1;
                rString += [i, S.assign, encodeURIComponent(query[i])].join('');
            });
        } catch (err) {
            log.warning('http: parseQuery: ' + err.message);
            return '';
        }
        return rString;
    }

    /**
     * @param {string} method
     * @param {string} url
     * @param {Object=} queryObj
     * @param {*=} data
     * @param {string=} mimeType
     * @param {string} xsrf
     * @param {string} bearer
     *
     * @return {!Object}
     */
    function newRequest(method, url, queryObj, data, mimeType, xsrf, bearer) {
        mimeType = (mimeType === undefined) ? S.mimeJSON : mimeType;
        queryObj = parseQuery(queryObj);
        if (queryObj !== false) {
            url += queryObj;
        }

        /** @type {!Object} */
        var xhr = self.HOMER.newXMLHttpRequest(),
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
            reason = (reason === undefined) ? E.fatal : reason;

            deferred.reject(new Error([S.self,
                                          S.onerror,
                                          reason,
                                          JSON.stringify(url)].join(E.delim)));
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
                self.HOMER.log.notice('!!! Logged Out !!!');
                if (self.HOMER.login) {
                    self.HOMER.login.logout();
                }
            }
            // otherwise error/unexpected
            onerror(S.status);
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
            xhr.setRequestHeader(S.headerContent, mimeType);
            if (xsrf !== undefined) {
                xhr.setRequestHeader('X-XSRF-TOKEN', xsrf);
            }
            if (bearer !== undefined) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + bearer);
            }

            if ((data === null) ||
                (data === false) ||
                (data === undefined)) {
                xhr.send();
            } else {
                xhr.send(JSON.stringify(data));
            }
        } catch (e) {
            onerror(E.unhandled);
            return deferred.promise;
        }

        timer = setTimeout(function () {
            var errorstr = S.timeout;
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

    /** @return {!Object} */
    function promisePreHooks() {
        /** @type {!Object} */
        var vow = Q.defer(),
            /** @type {Array} */
            hookResults = [];

        if (preHookDelay > preHookCap) {
            preHookDelay = preHookCap;
        }

        preHooks.forEach(function (hook) {
            hookResults.push(hook());
        });
        Q.all(hookResults).then(function goodHooks() {
            preHookDelay = preHookInitDelay;
            vow.resolve(true);
        }, function badHooks(reason) {
            setTimeout(function () {
                vow.reject(reason);
            }, preHookDelay *= preHookRate);
        }).fail(function (reason) {
            setTimeout(function () {
                vow.reject(reason);
            }, preHookDelay *= preHookRate);
        }).done();

        return vow.promise;
    }

    /**
     * @param {string} url
     * @param {!Object=} queryObj
     *
     * @return {!Object}
     */
    function get(url, queryObj) {
        return promisePreHooks().then(self.HOMER.bearer).then(function (bearer) {
            return newRequest(S.get, url, queryObj, undefined, undefined, undefined, bearer);
        });
    }

    /**
     * @param {string} url
     * @param {*} data
     * @param {!Object=} queryObj
     *
     * @return {!Object}
     */
    function put(url, data, queryObj) {
        return promisePreHooks().then(self.HOMER.xsrf).then(function (xsrf) {
            return self.HOMER.bearer().then(function (bearer) {
                return newRequest(S.put, url, queryObj, data, undefined, xsrf, bearer);
            });
        });
    }

    /**
     * @param {string} url
     * @param {*} data
     * @param {!Object=} queryObj
     *
     * @return {!Object}
     */
    function post(url, data, queryObj) {
        return promisePreHooks().then(self.HOMER.xsrf).then(function (xsrf) {
            return self.HOMER.bearer().then(function (bearer) {
                return newRequest(S.post, url, queryObj, data, undefined, xsrf, bearer);
            });
        });
    }

    http = Object.create(null, {
        'get': {
            value: get,
            configurable: false
        },
        'put': {
            value: put,
            configurable: false
        },
        'post': {
            value: post,
            configurable: false
        },
        'timeout': {
            value: function () {
                return defaultTimeout;
            },
            writable: false
        },
        'preHookPromise': {
            /** @param {function(...)} cb */
            value: function (cb) {
                if (typeof cb !== 'function') {
                    log.warning('http: invalid preHook promise: ' + typeof cb);
                    return;
                }
                preHooks.push(cb);
            }
        }
    });
    return http;
}]).factory('inlineXHR', [function () {
    'use strict';
    /**
     * inline xhr function
     *
     * @param url {string}
     * @param method {string}
     * @param data {*}
     * @param xsrf {string=}
     * @param callback {function(...)}
     */
    function fetch(url, method, data, xsrf, callback) {
        if (typeof callback !== 'function') {
            callback = function () {
            };
        }
        /** @type {!Object} */
        var xhr = new XMLHttpRequest(),
            noResponseTimer = setTimeout(function () {
                xhr.abort();

                if (setImmediate) {
                    setImmediate(callback, new Error('timeout'));
                } else {
                    // just go synchronous until setImmediate loads
                    callback(new Error('timeout'));
                }
            }, 60000);

        if (typeof callback !== 'function') {
            callback = function () {
            };
        }
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState !== 4) {
                return;
            }
            if (xhr.status === 200) {
                clearTimeout(noResponseTimer);
                callback(null, xhr.responseText);
            } else {
                callback(new Error('connection error'));
            }
        };
        xhr.open(method, url);
        if (xsrf) {
            xhr.setRequestHeader('X-XSRF-TOKEN', xsrf);
        }
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        if (!data) {
            xhr.send();
        } else {
            xhr.send(data);
        }
    }

    return fetch;
}]);