/**
 * file: http-spec.js
 * Created by michael on 23/05/14
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, HTTP, Q, MockHttpRequest*/

var http, mocks = [];

beforeEach(function () {
    'use strict';
    mocks = [];

    http = new HTTP(function () {
        mocks.push(new MockHttpRequest())
        return mocks[mocks.length - 1];
    });
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

    it('should have an on new access function', function () {
        expect(typeof http.onNoAccess).toBe('function');
    });

    it('should have a defaultHeader function', function () {
        expect(typeof http.defaultHeader).toBe('function');
    });

    it('should have a parseQuery function', function () {
        expect(typeof http.parseQuery).toBe('function');
    });

    it('should have a setPromiseLib function', function () {
        expect(typeof http.setPromiseLib).toBe('function');
    });

    it('should have PUT/POST/GET functions', function () {
        expect(typeof http.put).toBe('function');
        expect(typeof http.post).toBe('function');
        expect(typeof http.get).toBe('function');
    });
});

describe('promise configuration', function () {
    'use strict';

    it('should replace its default simple promises with a given library', function () {
        http.setPromiseLib(Q);
        expect(typeof http.Q.all).toBe('function');
    });

    it('should throw given an invalid promise', function () {
        var noop = function () {};
        expect(function () {
            http.setPromiseLib({});
        }).toThrow();

        expect(function () {
            http.setPromiseLib({defer: function () {
                return {
                    resolve: {}
                };
            }});
        }).toThrow();

        expect(function () {
            http.setPromiseLib({defer: function () {
                return {
                    resolve: noop,
                    reject: {}
                };
            }});
        }).toThrow();

        expect(function () {
            http.setPromiseLib({defer: function () {
                return {
                    resolve: noop,
                    reject: noop
                };
            }});
        }).toThrow();

        expect(function () {
            http.setPromiseLib({defer: function () {
                return {
                    resolve: noop,
                    reject: noop,
                    promise: {}
                };
            }});
        }).toThrow();

        expect(function () {
            http.setPromiseLib({defer: function () {
                return {
                    resolve: noop,
                    reject: noop,
                    promise: {
                        then: noop
                    }
                };
            }});
        }).not.toThrow();

    });
});

describe('methods', function () {
    'use strict';

    describe('get', function () {
        var result;
        it('should return a promise', function () {
            result = http.get('myResource');
            expect(typeof result.then).toBe('function');
        });

        it('should resolve the promise on a valid response', function () {
            var done = false;
            http.get('myResource').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('GET');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise on an invalid response', function () {
            var done = false;
            http.get('myResource').then(function (result) {
                done = false;
            }, function () {
                done = true;
            });

            expect(mocks[0].method).toBe('GET');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');

            mocks[0].receive(500, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise with default headers', function () {
            var done = false;
            http.defaultHeader('Authorization', 'tomato');
            http.get('myResource').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('GET');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');
            expect(mocks[0].getRequestHeader('Authorization')).toBe('tomato');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise with the provided headers', function () {
            var done = false;
            http.defaultHeader('Authorization', 'tomato');
            http.get('myResource', undefined, {Authorization: 'pizza', 'X-mde': 'steak'}).then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('GET');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');
            expect(mocks[0].getRequestHeader('Authorization')).toBe('tomato, pizza');
            expect(mocks[0].getRequestHeader('X-mde')).toBe('steak');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });

    });

    describe('put', function () {
        var result;
        it('should return a promise', function () {
            result = http.put('myResource', 'mydata');
            expect(typeof result.then).toBe('function');
        });

        it('should fail with no data', function () {
            var done = false;
            http.put('myResource').then(function (result) {
                done = false;
            }, function (reason) {
                done = true;
            });

            expect(done).toBe(true);
        });

        it('should resolve the promise on a valid response', function () {
            var done = false;
            http.put('myResource', 'mydata').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('PUT');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise on an invalid response', function () {
            var done = false;
            http.put('myResource', 'mydata').then(function (result) {
                done = false;
            }, function (reason) {
                done = true;
            });

            expect(mocks[0].method).toBe('PUT');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


            mocks[0].receive(500, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise with default headers', function () {
            var done = false;
            http.defaultHeader('Authorization', 'tomato');
            http.put('myResource', 'mydata').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('PUT');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');
            expect(mocks[0].getRequestHeader('Authorization')).toBe('tomato');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });
    });

    describe('post', function () {
        var result;
        it('should return a promise', function () {
            result = http.post('myResource', 'mydata');
            expect(typeof result.then).toBe('function');
        });

        it('should fail with no data', function () {
            var done = false;
            http.post('myResource').then(function (result) {
                done = false;
            }, function (reason) {
                done = true;
            });

            expect(done).toBe(true);
        });

        it('should resolve the promise on a valid response', function () {
            var done = false;
            http.post('myResource', 'mydata').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('POST');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise on an invalid response', function () {
            var done = false;
            http.post('myResource', 'mydata').then(function (result) {
                done = false;
            }, function (reason) {
                done = true;
            });

            expect(mocks[0].method).toBe('POST');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


            mocks[0].receive(500, 'done!');
            expect(done).toBe(true);
        });

        it('should resolve the promise with default headers', function () {
            var done = false;
            http.defaultHeader('Authorization', 'tomato');
            http.post('myResource', 'mydata').then(function (result) {
                done = true;
                expect(result).toBe('done!');
            }, function (reason) {
                done = false;
                console.log(reason);
            });

            expect(mocks[0].method).toBe('POST');
            expect(mocks[0].url).toBe('myResource');
            expect(mocks[0].requestText).toBe(JSON.stringify('mydata'));
            expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');
            expect(mocks[0].getRequestHeader('Authorization')).toBe('tomato');


            mocks[0].receive(200, 'done!');
            expect(done).toBe(true);
        });
    });
});

describe('on no access', function () {
    'use strict';

    it('should call on no access registered functions', function () {
        var done = false;

        http.onNoAccess(function () {
            done = true;
        });

        http.get('myResource').then(function (result) {
        }, function (reason) {
        });

        expect(mocks[0].method).toBe('GET');
        expect(mocks[0].url).toBe('myResource');
        expect(mocks[0].getRequestHeader('Content-Type')).toBe('application/json');


        mocks[0].receive(401, 'done!');
        expect(done).toBe(true);

    });

    it('should return false given an invalid parameter', function () {
        expect(http.onNoAccess({})).toBe(false);
        expect(http.onNoAccess(function () {})).toBe(true);
    });
});

describe('defaultHeader functionality', function () {
    'use strict';

    it('should be able to get/set default Headers', function () {
        var test = [
            {key: 'Content', value: 'Cheese'}
        ], results = [];
        test.forEach(function (params) {
            var obj = Object.create(null);
            obj[params.key] = params.value;
            results.push(obj);
        });


        expect(JSON.stringify(http.defaultHeader())).toBe(JSON.stringify(Object.create(null)));
        http.defaultHeader(test[0].key, test[0].value);
        expect(JSON.stringify(http.defaultHeader())).toBe(JSON.stringify(results[0]));
    });

    it('should return false given invalid headers', function () {
        expect(http.defaultHeader({chill: function () {}})).toBe(false);
    });
});

describe('logger functions', function () {
    'use strict';

    it('setLogger should upgrade the logger', function () {
        var log = false, info = false, warn = false, error = false, assert = false,
        flog = {
            log   : function () { log = true; },
            info  : function () { info = true; },
            warn  : function () { warn = true; },
            error : function () { error = true; },
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
            age : 5,
            name: 'joe'
        })).toBe('?age=5&name=joe');

        expect(http.parseQuery(
        {
            age : 5,
            name: 'joe w'
        })).toBe('?age=5&name=joe%20w');
    });

    it('should return an empty string given invalid data', function () {
    });
});