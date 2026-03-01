import { test, expect } from '@playwright/test';

const SHADCN_ACCORDION_URL = 'https://ui.shadcn.com/docs/components/accordion';

type TriggerMetrics = {
  height: number;
  fontSize: string;
  paddingTop: number;
  paddingBottom: number;
};

async function getTriggerMetrics(locator: any): Promise<TriggerMetrics> {
  const metrics = await locator.evaluate((el: HTMLElement) => {
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      height: box.height,
      fontSize: s.fontSize,
      paddingTop: parseFloat(s.paddingTop || '0'),
      paddingBottom: parseFloat(s.paddingBottom || '0'),
    };
  });

  return metrics as TriggerMetrics;
}

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

async function forceLightTheme(page: any): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });
}

test.describe('Accordion visual and behavior match shadcn', () => {
  test('main demo trigger metrics are close and interactions work', async ({ page }) => {
    await page.goto(SHADCN_ACCORDION_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await forceLightTheme(page);
    const shadcnFirstTrigger = page.locator('[data-slot="component-preview"]').first().locator('[data-slot="accordion-trigger"]').first();
    await expect(shadcnFirstTrigger).toBeVisible();
    const shadcnMetrics = await getTriggerMetrics(shadcnFirstTrigger);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/accordion`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);

    const ourFirstTrigger = page.getByRole('button', { name: 'Product Information' }).first();
    await expect(ourFirstTrigger).toBeVisible();

    const ourMetrics = await getTriggerMetrics(ourFirstTrigger);
    const tol = 20;

    expect(Math.abs(ourMetrics.height - shadcnMetrics.height), 'trigger height').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourMetrics.paddingTop - shadcnMetrics.paddingTop), 'trigger padding top').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourMetrics.paddingBottom - shadcnMetrics.paddingBottom), 'trigger padding bottom').toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourMetrics.fontSize) - parsePx(shadcnMetrics.fontSize)), 'trigger font size').toBeLessThanOrEqual(2);

    await expect(ourFirstTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('disabled item and docs controls exist', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${blazorUrl}/components/accordion`, { waitUntil: 'networkidle', timeout: 20000 });

    const disabled = page.getByRole('button', { name: 'Premium feature information' }).first();
    await expect(disabled).toBeDisabled();

    const copyPage = page.getByRole('button', { name: 'Copy page' });
    await expect(copyPage).toBeVisible();

    const prev = page.locator('a[data-slot="button"][aria-label="Previous"]');
    const next = page.locator('a[data-slot="button"][aria-label="Next"]');

    await expect(prev).toHaveAttribute('href', '/components/typography');
    await expect(prev).toHaveClass(/extend-touch-target/);
    await expect(next).toHaveAttribute('href', '/components/alert');
    await expect(next).toHaveClass(/extend-touch-target/);
  });
});
