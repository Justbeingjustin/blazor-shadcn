import { test, expect } from '@playwright/test';

const SHADCN_DOCS_URL = 'https://ui.shadcn.com/docs';

type SidebarSnapshot = {
  sectionTitles: string[];
  linkTexts: string[];
  linkCount: number;
  hasLayoutToggle: boolean;
  asideWidth: number;
  asideHasBorderRight: boolean;
};

async function getSidebarSnapshot(page: any): Promise<SidebarSnapshot> {
  const sidebarSelector = 'aside, [data-sidebar], nav[class*="flex"][class*="flex-col"], [class*="sidebar"]';
  await page.waitForTimeout(800);

  const sectionTitles: string[] = await page.evaluate(() => {
    const sidebar = document.querySelector('aside') ?? document.querySelector('[data-sidebar]') ?? document.querySelector('nav');
    if (!sidebar) return [];
    const headings = sidebar.querySelectorAll('h4, [class*="font-medium"], .text-xs');
    return Array.from(headings).map((h) => (h as HTMLElement).textContent?.trim() ?? '').filter(Boolean);
  });

  const linkTexts: string[] = await page.evaluate(() => {
    const sidebar = document.querySelector('aside') ?? document.querySelector('[data-sidebar]') ?? document.querySelector('nav');
    if (!sidebar) return [];
    const links = sidebar.querySelectorAll('a');
    return Array.from(links).map((a) => (a as HTMLElement).textContent?.trim() ?? '').filter(Boolean);
  });

  const hasLayoutToggle = await page.evaluate(() => {
    const buttons = document.querySelectorAll('main button, [data-slot="docs"] button, header button');
    for (const b of Array.from(buttons)) {
      const el = b as HTMLElement;
      const label = el.getAttribute('aria-label') ?? '';
      const title = el.getAttribute('title') ?? '';
      if (/sidebar|menu|layout|panel|collapse|toggle|open/i.test(label + title)) return true;
      const inDocs = el.closest('[data-slot="docs"]');
      const hasSvg = el.querySelector('svg');
      if (inDocs && hasSvg && el.closest('div')?.querySelector('h1')) return true;
    }
    return false;
  });

  let asideWidth = 0;
  let asideHasBorderRight = false;
  const asideLoc = page.locator('aside').first();
  if (await asideLoc.count() > 0) {
    try {
      await asideLoc.waitFor({ state: 'visible', timeout: 3000 });
      asideWidth = await asideLoc.evaluate((el: HTMLElement) => el.getBoundingClientRect().width);
      asideHasBorderRight = await asideLoc.evaluate((el: HTMLElement) => parseFloat(getComputedStyle(el).borderRightWidth) > 0);
    } catch {
      // ignore
    }
  }

  return {
    sectionTitles,
    linkTexts,
    linkCount: linkTexts.length,
    hasLayoutToggle,
    asideWidth,
    asideHasBorderRight,
  };
}

type FontSnapshot = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  text: string;
};

async function getSidebarLinkFonts(page: any, url: string): Promise<FontSnapshot[]> {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  return await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return [];
    const links = aside.querySelectorAll('a');
    const results: FontSnapshot[] = [];
    const seen = new Set<string>();
    for (const a of Array.from(links)) {
      const text = (a as HTMLElement).textContent?.trim() ?? '';
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const s = getComputedStyle(a);
      results.push({
        text,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
      });
      if (results.length >= 5) break;
    }
    return results;
  });
}

test.describe('Sidebar and layout toggle match shadcn', () => {
  test('sidebar structure and layout toggle match shadcn', async ({ page }) => {
    test.setTimeout(50000);

    await page.goto(SHADCN_DOCS_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    const shadcn = await getSidebarSnapshot(page);
    console.log('Shadcn sidebar:', JSON.stringify({ ...shadcn, linkTexts: shadcn.linkTexts.slice(0, 35) }, null, 2));

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(blazorUrl + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);

    const ours = await getSidebarSnapshot(page);
    console.log('Our sidebar:', JSON.stringify({ ...ours, linkTexts: ours.linkTexts.slice(0, 35) }, null, 2));

    expect(ours.linkCount, 'sidebar has links').toBeGreaterThanOrEqual(5);
    expect(ours.sectionTitles.length, 'sidebar has sections').toBeGreaterThanOrEqual(1);
    expect(ours.hasLayoutToggle, 'has layout toggle button').toBe(true);
  });

  test('sidebar link fonts identical (Introduction same as others) and match shadcn', async ({ page }) => {
    test.setTimeout(50000);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    const ours = await getSidebarLinkFonts(page, blazorUrl + '/');
    expect(ours.length).toBeGreaterThanOrEqual(2);

    const intro = ours.find((x) => x.text === 'Introduction');
    const other = ours.find((x) => x.text === 'Installation' || x.text === 'Components');
    expect(intro).toBeDefined();
    expect(other).toBeDefined();

    expect(intro!.fontFamily, 'Introduction font-family').toBe(other!.fontFamily);
    expect(intro!.fontSize, 'Introduction font-size').toBe(other!.fontSize);
    expect(intro!.fontWeight, 'Introduction font-weight').toBe(other!.fontWeight);

    const shadcnFonts = await getSidebarLinkFonts(page, SHADCN_DOCS_URL);
    const shadcnIntro = shadcnFonts.find((x) => x.text === 'Introduction');
    if (shadcnIntro) {
      expect(intro!.fontSize, 'font-size matches shadcn').toBe(shadcnIntro.fontSize);
      expect(intro!.fontWeight, 'font-weight matches shadcn').toBe(shadcnIntro.fontWeight);
    }
  });
});
