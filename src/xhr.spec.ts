import { noop } from '@ch1/utility';
import { Xhr, parseQuery } from './xhr';

describe('xhr wrapper', () => {
  describe('Xhr constructor function', () => {
    let xhrObj: XMLHttpRequest;

    function FakeHttpRequest() {
      return xhrObj;
    }

    beforeEach(() => {
      xhrObj = {
        abort: noop,
        open: noop,
        readyState: -1,
        setRequestHeader: noop,
        send: noop,
        status: -1,
      } as any as XMLHttpRequest; // yes, this is fake :)
    });

    it('creates with a custom ', () => {
      const x = Xhr(FakeHttpRequest);

      expect(x).not.toBe(undefined);
    });

    it('times out if nothing happens', () => {
      const x = Xhr(FakeHttpRequest, 1);

      return expect(x.get('/foo')).rejects.toEqual(new Error('xhr: request timed out'));
    });

    it('resolves if the readyState is 4 and the response is 200', () => {
      const x = Xhr(FakeHttpRequest);

      const promise = x.get('/some/resource');

      (xhrObj as any).readyState = 4;
      (xhrObj as any).responseText = 'working';
      (xhrObj as any).status = 200;
      (xhrObj as any).onload();

      return expect(promise).resolves.toEqual('working');
    });

    it('rejects if the readyState is 4 and the response is not 200 or 201', () => {
      const x = Xhr(FakeHttpRequest);

      const promise = x.get('/some/resource');

      (xhrObj as any).readyState = 4;
      (xhrObj as any).responseText = 'working';
      (xhrObj as any).status = 404;
      (xhrObj as any).onload();

      return expect(promise).rejects.toEqual(new Error('xhr: non 200 status: 404'));
    });

    it('resolves if the readyState is 4 and the response is 201', () => {
      const x = Xhr(FakeHttpRequest);

      const promise = x.get('/some/resource');

      (xhrObj as any).readyState = 4;
      (xhrObj as any).responseText = 'working';
      (xhrObj as any).status = 201;
      (xhrObj as any).onload();

      return expect(promise).resolves.toEqual('working');
    });

    it('defers until readyState is 4 and the response is 200', (done) => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      let didRun = false;
      let didCheck = false;

      x.get('/some/resource').then((value: string) => {
        didRun = true;
        expect(value).toBe('working');
        expect(didCheck).toBe(true);
        done();
      }).catch(done);

      // Trigger the test
      (xhrObj as any).readyState = 2;
      (xhrObj as any).onload();

      setTimeout(() => {
        didCheck = true;
        expect(didRun).toBe(false);

        // let the test pass
        (xhrObj as any).readyState = 4;
      }, 5);



      (xhrObj as any).status = 200;
      (xhrObj as any).responseText = 'working';

    });

    it('forwards headers', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      const headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.get('/some/resource', undefined, { Authorization: 'bearer' });
      expect(headers.Authorization).toBe('bearer');
    });

    it('allows for default headers to be set', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      const headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.defaultHeader('Authorization', 'bearer');
      x.get('/some/resource');
      expect(headers.Authorization).toBe('bearer');
    });

    it('allows for default headers to be unset', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      let headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.defaultHeader('Authorization', 'bearer');
      x.get('/some/resource');
      expect(headers.Authorization).toBe('bearer');
      headers = {};
      x.defaultHeader('Authorization');
      x.get('/some/resource');
      expect(headers.Authorization).toBe(undefined);
    });

    it('allows for repeated calls to unset headers', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      let headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.defaultHeader('Authorization', 'bearer');
      x.get('/some/resource');
      expect(headers.Authorization).toBe('bearer');
      headers = {};
      x.defaultHeader('Authorization');
      x.defaultHeader('Authorization');
      x.get('/some/resource');
      expect(headers.Authorization).toBe(undefined);
    });

    it('ignores falsey calls to defaultHeader', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      const headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.defaultHeader('', 'bearer');
      x.get('/some/resource');
      expect(headers['']).toBe(undefined);
    });

    it('forces defaultHeader values to be strings', () => {
      const x = Xhr(FakeHttpRequest, 100, 1);
      const headers: { [key: string]: string } = {};
      xhrObj.setRequestHeader = (key: string, value: string) => {
        headers[key] = value;
      }
      x.defaultHeader('foo', 7 as any);
      x.get('/some/resource');
      expect(headers['foo']).toBe('7');
    });

    it('rejects put calls that have no data', () => {
      const x = Xhr(FakeHttpRequest);
      return expect(x.put('/somthing')).rejects.toEqual(new Error('xhr: newRequest: PUT: requires data'));
    });

    it('rejects post calls that have no data', () => {
      const x = Xhr(FakeHttpRequest);
      return expect(x.post('/somthing')).rejects.toEqual(new Error('xhr: newRequest: POST: requires data'));
    });

    it('stringifies post data', () => {
      const x = Xhr(FakeHttpRequest);
      const obj = { foo: 'bar' };
      let rec: any = null;
      xhrObj.send = ((value: any) => {
        rec = value;
      });
      x.post('/somthing', obj);
      expect(rec).toEqual(JSON.stringify(obj));
    });

    it('rejects if something blows up synchronously', () => {
      const x = Xhr(FakeHttpRequest);
      const error = new Error('chaos!');
      xhrObj.send = ((value: any) => {
        throw error;
      });
      return expect(x.get('/somthing')).rejects.toBe(error);
    });
  });

  describe('parseQuery function', () => {
    it('returns false if given no parameters', () => {
      expect(parseQuery()).toBe(false);
    });

    it('returns false if given a non object', () => {
      expect(parseQuery(7 as any)).toBe(false);
    });

    it('variablizes a single key/value pair', () => {
      const query = parseQuery({ foo: 'bar' });
      expect(query).toBe('?foo=bar');
    });

    it('variablizes a multiple key/value pairs', () => {
      const query = parseQuery({ foo: 'bar', baz: 'bof' });
      expect(query).toBe('?foo=bar&baz=bof');
    });
  });
});
