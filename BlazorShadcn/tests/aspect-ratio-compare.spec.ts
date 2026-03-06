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

test.describe('Aspect Ratio docs and previews', () => {
  test('docs sections and examples render in reference order', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';

    await page.goto(`${blazorUrl}/components/aspect-ratio`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);

    await expect(page.getByRole('heading', { name: 'Installation', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Usage', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Examples', exact: true })).toBeVisible();
    await expect(page.locator('h3#square')).toBeVisible();
    await expect(page.locator('h3#portrait')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RTL', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API Reference', exact: true })).toBeVisible();

    await expect(page.getByText('npx shadcn@latest add aspect-ratio', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Square', exact: true }).last()).toHaveAttribute('href', '#square');
    await expect(page.getByRole('link', { name: 'Portrait', exact: true }).last()).toHaveAttribute('href', '#portrait');
  });

  test('preview wrappers keep the expected aspect ratios', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';

    await page.goto(`${blazorUrl}/components/aspect-ratio`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);

    const squarePreview = page.getByRole('heading', { name: 'Square', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('[data-slot="preview"] [data-slot="aspect-ratio"]')
      .first();

    const portraitPreview = page.getByRole('heading', { name: 'Portrait', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('[data-slot="preview"] [data-slot="aspect-ratio"]')
      .first();

    const squareBox = await squarePreview.boundingBox();
    const portraitBox = await portraitPreview.boundingBox();

    expect(squareBox).not.toBeNull();
    expect(portraitBox).not.toBeNull();

    if (!squareBox || !portraitBox) {
      return;
    }

    expect(Math.abs(squareBox.width - squareBox.height)).toBeLessThanOrEqual(2);
    expect(Math.abs((portraitBox.width / portraitBox.height) - (9 / 16))).toBeLessThanOrEqual(0.03);
  });
});
