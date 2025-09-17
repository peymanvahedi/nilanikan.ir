import { get, post, del, ApiError } from './api';

describe('API helpers', () => {
  const OLD_FETCH = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = OLD_FETCH;
  });

  function mockFetchOnce(status: number, data: any, contentType = 'application/json') {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'Mock Status',
      headers: { get: () => contentType },
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
    } as any);
  }

  it('GET – موفق', async () => {
    const mockData = { hello: 'world' };
    mockFetchOnce(200, mockData);
    const res = await get('/test');
    expect(res).toEqual(mockData);
  });

  it('GET – خطای HTTP با throwOnHTTP=true', async () => {
    mockFetchOnce(500, { detail: 'server error' });
    await expect(get('/fail')).rejects.toBeInstanceOf(ApiError);
  });

  it('GET – خطای HTTP با throwOnHTTP=false و fallback', async () => {
    mockFetchOnce(404, { error: 'not found' });
    const res = await get('/fail', { throwOnHTTP: false, fallback: { foo: 'bar' } });
    expect(res).toEqual({ foo: 'bar' });
  });

  it('POST – موفق', async () => {
    const body = { username: 'john' };
    mockFetchOnce(201, { ok: true });
    const res = await post('/create', body);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect((opts as any).body).toEqual(JSON.stringify(body));
    expect(res).toEqual({ ok: true });
  });

  it('DELETE – موفق', async () => {
    mockFetchOnce(204, null);
    const res = await del('/remove');
    expect(res).toBeNull();
  });

  it('timeout – باید خطا بده', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Aborted')), 20000);
    })) as any;

    const promise = get('/timeout');
    jest.advanceTimersByTime(20000);
    await expect(promise).rejects.toThrow();
    jest.useRealTimers();
  });
});
