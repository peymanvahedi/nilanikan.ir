import { get } from './api';

// اگر ApiError تو api.ts Export شده، ایمپورتش می‌کنیم برای تایپ و چک کردن
// ⚠ اگر ApiError تو فایل public export نشده باشه باید اول export ش کنی
import type { ApiError } from './api';

describe('API error handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns fallback when throwOnHTTP=false', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Server error' }),
      } as any)
    );

    const result = await get('/test', {
      throwOnHTTP: false,
      fallback: { data: 'fallback' },
    });

    expect(result).toEqual({ data: 'fallback' });
  });

  it('throws ApiError when throwOnHTTP not set', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not Found' }),
      } as any)
    );

    await expect(get('/test')).rejects.toThrow(/HTTP 404/);

    // انتخابی: چک کنیم دقیقا از جنس ApiError باشه
    try {
      await get('/test');
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      // اگر ApiError رو به عنوان type export کردی
      // expect(err).toBeInstanceOf(ApiError);
      expect((err as any).status).toBe(404);
    }
  });
});
