/*global workular */

workular.module('js-http', []).factory('newXMLHttpRequest', ['global', function () {
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
}]).factory('http', ['q', 'log', 'newXMLHttpRequest', 'SimpleFakePromise', function (Q, log, newXMLHttpRequest, SimpleFakePromise) {
    'use strict';
    var http;


    //###HTTPBODY

    /*global HTTP*/


    http = new HTTP(newXMLHttpRequest);
    http.setPromiseLib(Q);
    http.setLogger(log);

    return http;
}]).factory('inlineXHR', [function () {
    'use strict';


    //###XHRBODY


    return fetch;
}]);