/**
 * quick xhr function
 *
 * @param url {string}
 * @param method {string}
 * @param data {*}
 * @param xsrf {string=} optional xsrf token
 * @param callback {function(...)}
 */
function fetch(url, method, data, xsrf, callback) {
    'use strict';
    if (typeof callback !== 'function') {
        callback = function () {
        };
    }
    /** @type {!Object} */
    var xhr = new XMLHttpRequest(),
    noResponseTimer = setTimeout(function () {
        xhr.abort();
        callback(new Error('timeout'));
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
