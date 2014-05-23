/**
 * Created by michael on 23/05/14.
 */

function HTTP() {
    'use strict';

    // ensure object constructor
    if (!(this instanceof HTTP)) {
        return new HTTP();
    }

    var that = this,
        log,
        /** @const */
        noop = function () {},
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

    /*global console*/
    if (typeof console !== 'undefined') {
        log = console;
    } else {
        log = {
            log : noop,
            info: noop,
            warn: noop,
            error: noop,
            assert: noop
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
     * expose the api
     */
    function expose() {
        that.setLogger = setLogger;
        that.log = log;
    }

    /**
     * initialize the object
     */
    function init () {
        expose();
    }
    init();
}

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
        this.log.warning('http: parseQuery: ' + err.message);
        return '';
    }
    return rString;
};

//
//
//E = E === undefined ? {
//    delim: ' : ',
//    fatal: ' fatal ',
//    remoteData: ' remoteData ',
//    unhandled: ' unhandled'
//} : E;
//

//
///**
// * @param {string} method
// * @param {string} url
// * @param {Object=} queryObj
// * @param {*=} data
// * @param {string=} mimeType
// * @param {string} xsrf
// * @param {string} bearer
// *
// * @return {!Object}
// */
//function newRequest(method, url, queryObj, data, mimeType, xsrf, bearer) {
//    mimeType = (mimeType === undefined) ? S.mimeJSON : mimeType;
//    queryObj = parseQuery(queryObj);
//    if (queryObj !== false) {
//        url += queryObj;
//    }
//
//    /** @type {!Object} */
//    var xhr = newXMLHttpRequest(),
//        /** @type {!Object} */
//        deferred = Q.defer(),
//        timer = false;
//
//    if ((method === 'POST') || (method === 'PUT')) {
//        if (!data) {
//            deferred.reject(new Error('http: newRequest: ' + method + ': has falsy data'));
//            return deferred.promise;
//        }
//    }
//
//    function clearTimer() {
//        if (timer !== false) {
//            clearTimeout(timer);
//            timer = false;
//        }
//    }
//
//    function onerror(reason) {
//        reason = (reason === undefined) ? E.fatal : reason;
//
//        deferred.reject(new Error([S.self,
//            S.onerror,
//            reason,
//            JSON.stringify(url)].join(E.delim)));
//        clearTimer();
//    }
//
//    function onload() {
//        // if the document isn't ready try again later
//        if (+xhr.readyState !== 4) {
//            return setTimeout(onload, 25);
//        }
//        // if the header has a 200, or 201 status handle it
//        if ((xhr.status === 200) || (xhr.status === 201)) {
//            deferred.resolve(xhr.responseText);
//            clearTimer();
//            return;
//        }
//        // if the header has a 400/401 status trip the logout flag
//        if (( xhr.status === 401) || (xhr.status === 400)) {
//            self.HOMER.log.notice('!!! Logged Out !!!');
//            if (self.HOMER.login) {
//                self.HOMER.login.logout();
//            }
//        }
//        // otherwise error/unexpected
//        onerror(S.status);
//    }
//
//    function onprogress(readyState) {
//        if (readyState) {
//            if (readyState.lengthComputable) {
//                deferred.notify(readyState);
//            }
//        }
//    }
//
//    try {
//        /** @type {function(...)} */
//        xhr.onload = onload;
//        /** @type {function(...)} */
//        xhr.onerror = function (e) {
//            onerror('http error ' + e.message);
//        };
//        /** @type {function(...)} */
//        xhr.onprogress = onprogress;
//
//        xhr.open(method, url, true);
//        xhr.setRequestHeader(S.headerContent, mimeType);
//        if (xsrf !== undefined) {
//            xhr.setRequestHeader('X-XSRF-TOKEN', xsrf);
//        }
//        if (bearer !== undefined) {
//            xhr.setRequestHeader('Authorization', 'Bearer ' + bearer);
//        }
//
//        if ((data === null) ||
//            (data === false) ||
//            (data === undefined)) {
//            xhr.send();
//        } else {
//            xhr.send(JSON.stringify(data));
//        }
//    } catch (e) {
//        onerror(E.unhandled);
//        return deferred.promise;
//    }
//
//    timer = setTimeout(function () {
//        var errorstr = S.timeout;
//        try {
//            xhr.abort();
//        } catch (err) {
//            errorstr = err.message;
//        } finally {
//            onerror(errorstr);
//        }
//    }, defaultTimeout);
//
//    return deferred.promise;
//}
//
///** @return {!Object} */
//function promisePreHooks() {
//    /** @type {!Object} */
//    var vow = Q.defer(),
//        /** @type {Array} */
//        hookResults = [];
//
//    if (preHookDelay > preHookCap) {
//        preHookDelay = preHookCap;
//    }
//
//    preHooks.forEach(function (hook) {
//        hookResults.push(hook());
//    });
//    Q.all(hookResults).then(function goodHooks() {
//        preHookDelay = preHookInitDelay;
//        vow.resolve(true);
//    }, function badHooks(reason) {
//        setTimeout(function () {
//            vow.reject(reason);
//        }, preHookDelay *= preHookRate);
//    }).fail(function (reason) {
//        setTimeout(function () {
//            vow.reject(reason);
//        }, preHookDelay *= preHookRate);
//    }).done();
//
//    return vow.promise;
//}
//
///**
// * @param {string} url
// * @param {!Object=} queryObj
// *
// * @return {!Object}
// */
//function get(url, queryObj) {
//    return promisePreHooks().then(self.HOMER.bearer).then(function (bearer) {
//        return newRequest(S.get, url, queryObj, undefined, undefined, undefined, bearer);
//    });
//}
//
///**
// * @param {string} url
// * @param {*} data
// * @param {!Object=} queryObj
// *
// * @return {!Object}
// */
//function put(url, data, queryObj) {
//    return promisePreHooks().then(self.HOMER.xsrf).then(function (xsrf) {
//        return self.HOMER.bearer().then(function (bearer) {
//            return newRequest(S.put, url, queryObj, data, undefined, xsrf, bearer);
//        });
//    });
//}
//
///**
// * @param {string} url
// * @param {*} data
// * @param {!Object=} queryObj
// *
// * @return {!Object}
// */
//function post(url, data, queryObj) {
//    return promisePreHooks().then(self.HOMER.xsrf).then(function (xsrf) {
//        return self.HOMER.bearer().then(function (bearer) {
//            return newRequest(S.post, url, queryObj, data, undefined, xsrf, bearer);
//        });
//    });
//}
//
//http = Object.create(null, {
//    'get': {
//        value: get,
//        configurable: false
//    },
//    'put': {
//        value: put,
//        configurable: false
//    },
//    'post': {
//        value: post,
//        configurable: false
//    },
//    'timeout': {
//        value: function () {
//            return defaultTimeout;
//        },
//        writable: false
//    }
//});