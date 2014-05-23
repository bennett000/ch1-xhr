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
}]).factory('http', ['q', 'stringsHTTP', 'log', 'newXMLHttpRequest', function (Q, S, log, newXMLHttpRequest) {
    'use strict';


    return http;
}]).factory('inlineXHR', [function () {
    'use strict';

    return fetch;
}]);