import { test, expect } from '@playwright/test';

test.describe('Popover docs behavior', () => {
  test('main demo shows all dimension fields and closes on outside click', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${blazorUrl}/components/popover`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const mainDemo = page.locator('[data-slot="preview"]').first();
    const openButton = mainDemo.locator('button[data-slot="button"]').first();
    const content = mainDemo.locator('[data-slot="popover-content"]');

    await openButton.click();
    await expect(content).toHaveCount(1);

    await expect(mainDemo.locator('#popover-demo-width')).toBeVisible();
    await expect(mainDemo.locator('#popover-demo-max-width')).toBeVisible();
    await expect(mainDemo.locator('#popover-demo-height')).toBeVisible();
    await expect(mainDemo.locator('#popover-demo-max-height')).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(content).toHaveCount(0);
  });

  test('basic and form examples include width and max size controls', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${blazorUrl}/components/popover`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const basicExample = page.locator('#basic [data-slot="preview"]').first();
    const basicContent = basicExample.locator('[data-slot="popover-content"]');

    await basicExample.locator('button[data-slot="button"]').first().click();
    await expect(basicContent).toHaveCount(1);
    await expect(basicExample.locator('#popover-basic-width')).toBeVisible();
    await expect(basicExample.locator('#popover-basic-max-width')).toBeVisible();
    await expect(basicExample.locator('#popover-basic-height')).toBeVisible();
    await expect(basicExample.locator('#popover-basic-max-height')).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(basicContent).toHaveCount(0);

    const formExample = page.locator('#with-form [data-slot="preview"]').first();
    const formContent = formExample.locator('[data-slot="popover-content"]');

    await formExample.locator('button[data-slot="button"]').first().click();
    await expect(formContent).toHaveCount(1);
    await expect(formExample.locator('#popover-form-width')).toBeVisible();
    await expect(formExample.locator('#popover-form-max-width')).toBeVisible();
    await expect(formExample.locator('#popover-form-height')).toBeVisible();
    await expect(formExample.locator('#popover-form-max-height')).toBeVisible();
  });
});
