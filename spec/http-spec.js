/**
 * file: http-spec.js
 * Created by michael on 23/05/14
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, HTTP */

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
                assert: function () { assert = true; },
            };
        expect(typeof http.setLogger).toBe('function');
        http.setLogger(flog);

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