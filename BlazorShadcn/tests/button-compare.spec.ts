import { test, expect } from '@playwright/test';

const SHADCN_BUTTON_URL = 'https://ui.shadcn.com/docs/components/button';

type ButtonMetrics = {
  height: number;
  width: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  fontSize: string;
  borderRadius: string;
};

async function getMetrics(page: any, locator: any): Promise<ButtonMetrics> {
  const metrics = await locator.evaluate((el: HTMLElement) => {
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      height: box.height,
      width: box.width,
      paddingTop: parseFloat(s.paddingTop),
      paddingRight: parseFloat(s.paddingRight),
      paddingBottom: parseFloat(s.paddingBottom),
      paddingLeft: parseFloat(s.paddingLeft),
      fontSize: s.fontSize,
      borderRadius: s.borderRadius,
    };
  });
  return metrics as ButtonMetrics;
}

test.describe('Button visual match shadcn', () => {
  test('outline text button and icon button metrics match shadcn', async ({ page }) => {
    // 1) Load shadcn docs – find first demo: two buttons (Outline "Button" + Outline icon)
    await page.goto(SHADCN_BUTTON_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('[data-slot="button"]', { timeout: 10000 });
    const shadcnTextBtn = page.getByRole('button', { name: 'Button' }).first();
    const shadcnIconBtn = page.locator('[data-slot="button"]').filter({ has: page.locator('svg') }).filter({ hasNot: page.getByText('Button', { exact: true }) }).first();
    await shadcnTextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await shadcnIconBtn.waitFor({ state: 'visible', timeout: 5000 });

    const shadcnTextMetrics = await getMetrics(page, shadcnTextBtn);
    const shadcnIconMetrics = await getMetrics(page, shadcnIconBtn);
    console.log('Shadcn text:', JSON.stringify(shadcnTextMetrics));
    console.log('Shadcn icon:', JSON.stringify(shadcnIconMetrics));

    // 2) Load our app
    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(`${blazorUrl}/components/button`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const ourTextBtn = page.locator('button[data-slot="button"]').filter({ hasText: 'Button' }).first();
    const ourIconBtn = page.locator('button[data-slot="button"]').filter({ has: page.locator('svg') }).filter({ hasNot: page.getByText('Button', { exact: true }) }).first();
    await ourTextBtn.waitFor({ state: 'visible', timeout: 15000 });
    await ourIconBtn.waitFor({ state: 'visible', timeout: 5000 });

    const ourTextMetrics = await getMetrics(page, ourTextBtn);
    const ourIconMetrics = await getMetrics(page, ourIconBtn);
    console.log('Ours text:', JSON.stringify(ourTextMetrics));
    console.log('Ours icon:', JSON.stringify(ourIconMetrics));

    const tol = 1.5;
    const parsePx = (s: string) => (s ? parseFloat(s) : 0);
    expect(Math.abs(ourTextMetrics.height - shadcnTextMetrics.height), `Text height: ${ourTextMetrics.height} vs ${shadcnTextMetrics.height}`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourTextMetrics.paddingLeft - shadcnTextMetrics.paddingLeft), `Text paddingLeft`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourTextMetrics.paddingRight - shadcnTextMetrics.paddingRight), `Text paddingRight`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourTextMetrics.paddingTop - shadcnTextMetrics.paddingTop), `Text paddingTop`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourTextMetrics.paddingBottom - shadcnTextMetrics.paddingBottom), `Text paddingBottom`).toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourTextMetrics.borderRadius) - parsePx(shadcnTextMetrics.borderRadius)), `Text borderRadius: ${ourTextMetrics.borderRadius} vs ${shadcnTextMetrics.borderRadius}`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourIconMetrics.height - shadcnIconMetrics.height), `Icon height`).toBeLessThanOrEqual(tol);
    expect(Math.abs(ourIconMetrics.width - shadcnIconMetrics.width), `Icon width`).toBeLessThanOrEqual(tol);
    expect(Math.abs(parsePx(ourIconMetrics.borderRadius) - parsePx(shadcnIconMetrics.borderRadius)), `Icon borderRadius`).toBeLessThanOrEqual(tol);
  });
});
