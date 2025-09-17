import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_API_BASE || 'http://127.0.0.1:8000';

test.describe('API E2E tests', () => {
  test('GET /api/home returns 200 and has data', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/home/`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('vip');
    expect(data).toHaveProperty('setsAndPuffer');
  });
});
