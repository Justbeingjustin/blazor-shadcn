import { test, expect } from '@playwright/test';

async function forceLightTheme(page: any): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });
}

test.describe('Breadcrumb docs and structure', () => {
  test('basic preview renders breadcrumb semantics', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/breadcrumb`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);

    const basicHeading = page.getByRole('heading', { name: 'Basic', exact: true });
    const preview = basicHeading.locator('xpath=following::div[@data-slot="component-preview"][1]').locator('[data-slot="preview"]').first();

    await expect(preview.locator('nav[data-slot="breadcrumb"]')).toHaveAttribute('aria-label', 'breadcrumb');
    await expect(preview.locator('ol[data-slot="breadcrumb-list"]')).toBeVisible();
    await expect(preview.locator('[data-slot="breadcrumb-link"]').first()).toContainText('Home');
    await expect(preview.locator('[data-slot="breadcrumb-page"]').first()).toHaveAttribute('aria-current', 'page');
    await expect(preview.locator('[data-slot="breadcrumb-separator"]')).toHaveCount(2);
  });

  test('docs controls exist', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${blazorUrl}/components/breadcrumb`, { waitUntil: 'networkidle', timeout: 20000 });

    await expect(page.getByRole('button', { name: 'Copy page' }).first()).toBeVisible();
    await expect(page.locator('a[data-slot="button"][aria-label="Previous"]')).toHaveAttribute('href', '/components/badge');
    await expect(page.locator('a[data-slot="button"][aria-label="Next"]')).toHaveAttribute('href', '/components/button');
  });
});
