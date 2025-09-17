import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('صفحه اصلی', () => {
  test('لود کامل با کامپوننت‌های اصلی', async ({ page }) => {
    // ۱) ورود به صفحه اصلی و صبر برای لود کامل شبکه
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // ۲) چک عنوان فارسی یا انگلیسی
    await expect(page).toHaveTitle(/نیلانیکان|Nilanikan/i);

    // ۳) چک وجود و visible بودن Carousel با data-testid
    await page.waitForSelector('[data-testid="carousel"]', { timeout: 15000 });
    const carousel = page.locator('[data-testid="carousel"]');
    await expect(carousel).toBeVisible();

    // ۴) چک وجود و visible بودن منوی اصلی
    const nav = page.locator('[data-testid="nav"]');
    await expect(nav).toBeVisible();

    // ۵) انتظار برای لود اولین کارت محصول
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible();

    // ۶) چک تصویر کارت محصول که از media لود شده باشد
    const firstImage = firstProduct.locator('img');
    await expect(firstImage).toHaveAttribute('src', /media\//);
  });
});
