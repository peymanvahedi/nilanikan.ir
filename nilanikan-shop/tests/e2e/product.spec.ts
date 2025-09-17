import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://192.168.103.17:3000';

test.describe('صفحه جزئیات محصول', () => {
  test('افزودن محصول به سبد خرید', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');

    // صبر تا AttributePicker بیاد
    await page.waitForTimeout(1000);

    // انتخاب یک گزینه قابل مشاهده از هر ویژگی
    const optionButtons = page.locator('[data-testid="product-option"]');
    const count = await optionButtons.count();
    const chosenGroups = new Set<string>();

    for (let i = 0; i < count; i++) {
      const btn = optionButtons.nth(i);
      if (await btn.isVisible()) {
        const group = await btn.evaluate(
          el => el.closest('div')?.previousElementSibling?.textContent?.trim() || ''
        );
        if (!chosenGroups.has(group)) {
          await btn.click();
          chosenGroups.add(group);
        }
      }
    }

    // منتظر ظاهر شدن دکمه
    const addToCart = page.locator('[data-testid="add-to-cart"]');
    await addToCart.waitFor({ state: 'visible', timeout: 15000 });
    await addToCart.click();

    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText(/^\d+$/);
  });
});
