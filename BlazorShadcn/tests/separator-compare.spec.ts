import { test, expect } from '@playwright/test';

const SHADCN_SEPARATOR_URL = 'https://ui.shadcn.com/docs/components/separator';

type SeparatorMetrics = {
  height: number;
  width: number;
  backgroundColor: string;
};

type PairMetrics = {
  horizontal: SeparatorMetrics;
  vertical: SeparatorMetrics;
};

async function getPairMetrics(container: any): Promise<PairMetrics> {
  const metrics = await container.evaluate((el: HTMLElement) => {
    const nodes = Array.from(el.querySelectorAll('[data-slot="separator"]')) as HTMLElement[];
    const normalize = (value: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return value;
      ctx.fillStyle = '#000';
      ctx.fillStyle = value;
      return ctx.fillStyle;
    };
    const mapped = nodes
      .map((node) => {
        const s = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          height: box.height,
          width: box.width,
          backgroundColor: normalize(s.backgroundColor),
        };
      })
      .filter((m) => m.height > 0 && m.width > 0);

    const horizontal = mapped.filter((m) => m.width >= m.height).sort((a, b) => b.width - a.width)[0];
    const vertical = mapped.filter((m) => m.height > m.width).sort((a, b) => b.height - a.height)[0];

    return { horizontal, vertical };
  });

  return metrics as PairMetrics;
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

test.describe('Separator visual match shadcn', () => {
  test('horizontal and vertical separator metrics match shadcn', async ({ page }) => {
    await page.goto(SHADCN_SEPARATOR_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await forceLightTheme(page);
    await page.waitForSelector('[data-slot="component-preview"] [data-slot="separator"]', { timeout: 10000 });

    const shadcnMainPreview = page.locator('[data-slot="component-preview"]').first().locator('[data-slot="preview"]').first();
    const shadcnVerticalTitle = page.getByRole('heading', { name: 'Vertical', exact: true }).first();
    const shadcnVerticalPreview = shadcnVerticalTitle
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('[data-slot="preview"]')
      .first();

    const shadcnMainMetrics = await getPairMetrics(shadcnMainPreview);
    const shadcnVerticalMetricsOnly = await getPairMetrics(shadcnVerticalPreview);
    const shadcnMetrics: PairMetrics = {
      horizontal: shadcnMainMetrics.horizontal,
      vertical: shadcnVerticalMetricsOnly.vertical,
    };

    expect(shadcnMetrics.horizontal, 'shadcn horizontal separator not found').toBeTruthy();
    expect(shadcnMetrics.vertical, 'shadcn vertical separator not found').toBeTruthy();

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/separator`, { waitUntil: 'networkidle', timeout: 20000 });
    await forceLightTheme(page);
    await page.waitForSelector('[data-slot="component-preview"] [data-slot="separator"]', { timeout: 10000 });

    const ourMainPreview = page.locator('[data-slot="component-preview"]').first().locator('[data-slot="preview"]').first();
    const ourVerticalTitle = page.getByRole('heading', { name: 'Vertical', exact: true }).first();
    const ourVerticalPreview = ourVerticalTitle
      .locator('xpath=following::div[@data-slot="component-preview"][1]')
      .locator('[data-slot="preview"]')
      .first();

    const ourMainMetrics = await getPairMetrics(ourMainPreview);
    const ourVerticalMetricsOnly = await getPairMetrics(ourVerticalPreview);
    const ourMetrics: PairMetrics = {
      horizontal: ourMainMetrics.horizontal,
      vertical: ourVerticalMetricsOnly.vertical,
    };

    expect(ourMetrics.horizontal, 'our horizontal separator not found').toBeTruthy();
    expect(ourMetrics.vertical, 'our vertical separator not found').toBeTruthy();

    const tol = 1.5;
    expect(Math.abs(ourMetrics.horizontal.height - shadcnMetrics.horizontal.height), 'horizontal height').toBeLessThanOrEqual(tol);
    expect(Math.abs(ourMetrics.vertical.width - shadcnMetrics.vertical.width), 'vertical width').toBeLessThanOrEqual(tol);

    const rgbLike = (value: string) => /^rgba?\(/i.test(value.trim());
    if (rgbLike(ourMetrics.horizontal.backgroundColor) && rgbLike(shadcnMetrics.horizontal.backgroundColor)) {
      expect(maxColorDelta(ourMetrics.horizontal.backgroundColor, shadcnMetrics.horizontal.backgroundColor), 'horizontal border color').toBeLessThanOrEqual(0.001);
    } else {
      expect(ourMetrics.horizontal.backgroundColor.length, 'horizontal border color resolved').toBeGreaterThan(0);
      expect(shadcnMetrics.horizontal.backgroundColor.length, 'horizontal border color resolved').toBeGreaterThan(0);
    }

    if (rgbLike(ourMetrics.vertical.backgroundColor) && rgbLike(shadcnMetrics.vertical.backgroundColor)) {
      expect(maxColorDelta(ourMetrics.vertical.backgroundColor, shadcnMetrics.vertical.backgroundColor), 'vertical border color').toBeLessThanOrEqual(0.001);
    } else {
      expect(ourMetrics.vertical.backgroundColor.length, 'vertical border color resolved').toBeGreaterThan(0);
      expect(shadcnMetrics.vertical.backgroundColor.length, 'vertical border color resolved').toBeGreaterThan(0);
    }
  });
});
