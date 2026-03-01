import { test, expect } from '@playwright/test';

const SHADCN_BADGE_URL = 'https://ui.shadcn.com/docs/components/radix/badge';

type BadgeMetrics = {
  height: number;
  paddingLeft: number;
  paddingRight: number;
  fontSize: string;
  borderWidth: string;
};

type BadgeColors = {
  backgroundColor: string;
  color: string;
  className: string;
};

async function getMetrics(locator: any): Promise<BadgeMetrics> {
  const metrics = await locator.evaluate((el: HTMLElement) => {
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      height: box.height,
      paddingLeft: parseFloat(s.paddingLeft),
      paddingRight: parseFloat(s.paddingRight),
      fontSize: s.fontSize,
      borderWidth: s.borderWidth,
    };
  });

  return metrics as BadgeMetrics;
}

async function getColors(locator: any): Promise<BadgeColors> {
  const colors = await locator.evaluate((el: HTMLElement) => {
    const s = getComputedStyle(el);

    const normalize = (value: string) => {
      // Use the browser's CSS parser + computed style to normalize to rgb/rgba.
      // This is more reliable than <canvas> for modern color syntaxes (oklch, color-mix, etc).
      const tmp = document.createElement('div');
      tmp.style.color = value;
      document.body.appendChild(tmp);
      const out = getComputedStyle(tmp).color;
      tmp.remove();
      return out;
    };

    return {
      backgroundColor: (() => {
        const tmp = document.createElement('div');
        tmp.style.backgroundColor = s.backgroundColor;
        document.body.appendChild(tmp);
        const out = getComputedStyle(tmp).backgroundColor;
        tmp.remove();
        return out;
      })(),
      color: normalize(s.color),
      className: el.className,
    };
  });

  return colors as BadgeColors;
}

function parseColorNumbers(color: string): number[] {
  const matches = color.match(/-?\d*\.?\d+/g) || [];
  return matches.map((v) => Number(v));
}

function maxColorDelta(a: string, b: string): number {
  const av = parseColorNumbers(a);
  const bv = parseColorNumbers(b);
  const len = Math.min(av.length, bv.length);
  let max = 0;
  for (let i = 0; i < len; i += 1) {
    max = Math.max(max, Math.abs(av[i] - bv[i]));
  }
  return max;
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

test.describe('Badge visual match shadcn', () => {
  test('default and outline badge metrics match shadcn', async ({ page }) => {
    await page.goto(SHADCN_BADGE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await forceLightTheme(page);
    await page.waitForSelector('[data-slot="badge"]', { timeout: 10000 });

    const shadcnDefault = page.locator('[data-slot="badge"]').filter({ hasText: 'Badge' }).first();
    const shadcnOutline = page.locator('[data-slot="badge"]').filter({ hasText: 'Outline' }).first();
    const shadcnDestructive = page.locator('[data-slot="badge"]').filter({ hasText: 'Destructive' }).first();

    await shadcnDefault.waitFor({ state: 'visible', timeout: 10000 });
    await shadcnOutline.waitFor({ state: 'visible', timeout: 10000 });
    await shadcnDestructive.waitFor({ state: 'visible', timeout: 10000 });

    const shadcnDefaultMetrics = await getMetrics(shadcnDefault);
    const shadcnOutlineMetrics = await getMetrics(shadcnOutline);
    const shadcnDestructiveColors = await getColors(shadcnDestructive);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);
    await page.locator('a[href="/components/badge"]').first().click();
    await page.waitForURL(/\/components\/badge/, { timeout: 10000 });
    await page.waitForSelector('[data-slot="badge"]', { timeout: 10000 });

    const firstPreview = page.locator('[data-slot="component-preview"]').first();
    await expect(firstPreview.locator('[data-slot="badge"]')).toHaveCount(4);
    await expect(firstPreview).not.toContainText('Verified');
    await expect(firstPreview).not.toContainText('20+');

    const ourDefault = firstPreview.locator('[data-slot="badge"]').filter({ hasText: 'Badge' }).first();
    const ourOutline = firstPreview.locator('[data-slot="badge"]').filter({ hasText: 'Outline' }).first();
    const ourDestructive = firstPreview.locator('[data-slot="badge"]').filter({ hasText: 'Destructive' }).first();

    await ourDefault.waitFor({ state: 'visible', timeout: 10000 });
    await ourOutline.waitFor({ state: 'visible', timeout: 10000 });
    await ourDestructive.waitFor({ state: 'visible', timeout: 10000 });

    const ourDefaultMetrics = await getMetrics(ourDefault);
    const ourOutlineMetrics = await getMetrics(ourOutline);
    const ourDestructiveColors = await getColors(ourDestructive);

    const tol = 1.5;
    const parsePx = (value: string) => (value ? parseFloat(value) : 0);

    expect(Math.abs(ourDefaultMetrics.height - shadcnDefaultMetrics.height), 'default height').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourDefaultMetrics.paddingLeft - shadcnDefaultMetrics.paddingLeft), 'default padding left').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourDefaultMetrics.paddingRight - shadcnDefaultMetrics.paddingRight), 'default padding right').toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourDefaultMetrics.fontSize) - parsePx(shadcnDefaultMetrics.fontSize)), 'default font size').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourOutlineMetrics.height - shadcnOutlineMetrics.height), 'outline height').toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourOutlineMetrics.borderWidth) - parsePx(shadcnOutlineMetrics.borderWidth)), 'outline border width').toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourOutlineMetrics.fontSize) - parsePx(shadcnOutlineMetrics.fontSize)), 'outline font size').toBeLessThanOrEqual(tol);

    console.log('Shadcn destructive:', shadcnDestructiveColors);
    console.log('Our destructive:', ourDestructiveColors);

    // This should be stable and identical if our tokens match shadcn's theme.
    expect(maxColorDelta(ourDestructiveColors.backgroundColor, shadcnDestructiveColors.backgroundColor), 'destructive background color').toBeLessThanOrEqual(0.001);
    expect(ourDestructiveColors.className, 'destructive class').toContain('text-destructive');
  });

  test('docs pager buttons and Copy page exist on our badge page', async ({ page }) => {
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';

    // Sidebar + pager only render at xl breakpoint (>= 1280px).
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${blazorUrl}/components/badge`, { waitUntil: 'networkidle', timeout: 20000 });

    const copyPage = page.getByRole('button', { name: 'Copy page' });
    await expect(copyPage).toBeVisible();

    await copyPage.click();
    await expect(copyPage.locator('svg').first()).toBeVisible();

    const prev = page.locator('a[data-slot="button"][aria-label="Previous"]');
    const next = page.locator('a[data-slot="button"][aria-label="Next"]');

    await expect(prev).toHaveAttribute('href', '/components/avatar');
    await expect(prev).toHaveClass(/extend-touch-target/);

    await expect(next).toHaveAttribute('href', '/components/breadcrumb');
    await expect(next).toHaveClass(/extend-touch-target/);
  });
});
