import { test, expect } from '@playwright/test';

const SHADCN_TYPOGRAPHY_URL = 'https://ui.shadcn.com/docs/components/radix/typography';

type TextMetrics = {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
};

async function forceLightTheme(page: any): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });
}

async function getTextMetrics(locator: any): Promise<TextMetrics> {
  const metrics = await locator.evaluate((el: HTMLElement) => {
    const s = getComputedStyle(el);
    const parse = (value: string) => {
      const n = Number.parseFloat(value || '0');
      return Number.isFinite(n) ? n : 0;
    };

    return {
      fontSize: parse(s.fontSize),
      fontWeight: parse(s.fontWeight),
      lineHeight: parse(s.lineHeight),
      letterSpacing: parse(s.letterSpacing),
    };
  });

  return metrics as TextMetrics;
}

test.describe('Typography visual match shadcn', () => {
  test('key typography metrics are close to shadcn', async ({ page }) => {
    await page.goto(SHADCN_TYPOGRAPHY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await forceLightTheme(page);

    const shadcnH1 = page.getByRole('heading', { name: 'h1', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('h1')
      .first();
    await expect(shadcnH1).toBeVisible();
    const shadcnH1Metrics = await getTextMetrics(shadcnH1);

    const shadcnInlineCode = page.getByRole('heading', { name: 'Inline code', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('code')
      .first();
    await expect(shadcnInlineCode).toBeVisible();
    const shadcnInlineCodeMetrics = await getTextMetrics(shadcnInlineCode);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/typography`, { waitUntil: 'networkidle', timeout: 30000 });
    await forceLightTheme(page);

    const ourH1 = page.getByRole('heading', { name: 'h1', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('h1')
      .first();
    await expect(ourH1).toBeVisible();
    const ourH1Metrics = await getTextMetrics(ourH1);

    const ourInlineCode = page.getByRole('heading', { name: 'Inline code', exact: true })
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('code')
      .first();
    await expect(ourInlineCode).toBeVisible();
    const ourInlineCodeMetrics = await getTextMetrics(ourInlineCode);

    const tol = 1.5;
    expect(Math.abs(ourH1Metrics.fontSize - shadcnH1Metrics.fontSize), 'h1 font size').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourH1Metrics.fontWeight - shadcnH1Metrics.fontWeight), 'h1 font weight').toBeLessThanOrEqual(50);
    expect(Math.abs(ourH1Metrics.lineHeight - shadcnH1Metrics.lineHeight), 'h1 line height').toBeLessThanOrEqual(tol);

    expect(Math.abs(ourInlineCodeMetrics.fontSize - shadcnInlineCodeMetrics.fontSize), 'inline code font size').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourInlineCodeMetrics.fontWeight - shadcnInlineCodeMetrics.fontWeight), 'inline code font weight').toBeLessThanOrEqual(50);
    expect(Math.abs(ourInlineCodeMetrics.letterSpacing - shadcnInlineCodeMetrics.letterSpacing), 'inline code letter spacing').toBeLessThanOrEqual(0.2);
  });

  test('all typography sections render in order on our page', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/typography`, { waitUntil: 'networkidle', timeout: 30000 });

    const expected = ['h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'table', 'list', 'Inline code', 'Lead', 'Large', 'Small', 'Muted', 'RTL'];
    for (const title of expected) {
      await expect(page.getByRole('heading', { name: title, exact: true }).first(), `missing section ${title}`).toBeVisible();
    }
  });
});
