/**
 * file: http-spec.js
 * Created by michael on 23/05/14
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, HTTP, Q*/

var http;

beforeEach(function () {
    'use strict';

    http = new HTTP();
});

describe('http API', function () {
    'use strict';

    it('should be an object with, or without new', function () {
        expect(http instanceof HTTP).toBe(true);
        expect(HTTP() instanceof HTTP).toBe(true);
    });

    it('should have a reference to a promise library', function () {
        expect(typeof http.Q).toBeTruthy();
        expect(typeof http.Q.defer).toBe('function');
        expect(typeof http.Q.defer().resolve).toBe('function');
        expect(typeof http.Q.defer().reject).toBe('function');
        expect(typeof http.Q.defer().promise).toBe('object');
        expect(typeof http.Q.defer().promise.then).toBe('function');
    });

    it('should have a log object', function () {
        expect(typeof http.log).toBe('object');
        expect(typeof http.log.log).toBe('function');
        expect(typeof http.log.info).toBe('function');
        expect(typeof http.log.warn).toBe('function');
        expect(typeof http.log.error).toBe('function');
        expect(typeof http.log.assert).toBe('function');
    });

    it('should have a setLogger function', function () {
        expect(typeof http.setLogger).toBe('function');
    });

    it('should have a parseQuery function', function () {
        expect(typeof http.parseQuery).toBe('function');
    });

    it('should have a setPromiseLib function', function () {
        expect(typeof http.setPromiseLib).toBe('function');
    });
});

describe('promise configuration', function () {
    'use strict';

    it('should replace its default simple promises with a given library', function () {
        http.setPromiseLib(Q);
        expect(typeof http.Q.all).toBe('function');
    });
});

describe('logger functions', function () {
    'use strict';

    it('setLogger should upgrade the logger', function () {
        var log = false, info = false, warn = false, error = false, assert = false,
            flog = {
                log: function () { log = true; },
                info: function () { info = true; },
                warn: function () { warn = true; },
                error: function () { error = true; },
                assert: function () { assert = true; }
            }, oldConsole;
        expect(typeof http.setLogger).toBe('function');
        http.setLogger(flog);

        function testLog() {
            http.log.log('hi');
            http.log.info('hi');
            http.log.warn('hi');
            http.log.error('hi');
            http.log.assert('hi');

            expect(log).toBe(true);
            expect(info).toBe(true);
            expect(warn).toBe(true);
            expect(error).toBe(true);
            expect(assert).toBe(true);
        }

        testLog();

        /*global console*/
        oldConsole = console;
        window.console = undefined;

        http = new HTTP();
        testLog();
        window.console = oldConsole;
    });
});

describe('parseQuery function', function () {
    'use strict';

    it('should return false given no parameters', function () {
        expect(http.parseQuery()).toBe(false);
    });

    it('should return false given a non object parameter', function () {
        expect(http.parseQuery('hello')).toBe(false);
        expect(http.parseQuery(23523)).toBe(false);
    });

    it('should return a query string given an empty object', function () {
        expect(http.parseQuery({})).toBe('?');
    });

    it('should return a uri encoded string based on the object\'s attributes, and values', function () {
        expect(http.parseQuery(
        {
            age: 5
        })).toBe('?age=5');

        expect(http.parseQuery(
        {
            age: 5,
            name: 'joe'
        })).toBe('?age=5&name=joe');

        expect(http.parseQuery(
        {
            age: 5,
            name: 'joe w'
        })).toBe('?age=5&name=joe%20w');
    });

    it('should return an empty string given invalid data', function () {
    });
});