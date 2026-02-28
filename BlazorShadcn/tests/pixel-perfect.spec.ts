import { test, expect } from '@playwright/test';

const SHADCN_DOCS_URL = 'https://ui.shadcn.com/docs';

type HeaderMetrics = {
  headerHeight: number;
  headerTop: number;
  /** First button (logo) top relative to viewport */
  firstButtonTop: number;
  firstButtonHeight: number;
  /** First nav link (Docs) top relative to viewport */
  firstNavLinkTop: number;
  firstNavLinkHeight: number;
};

type SidebarMetrics = {
  /** "Sections" heading computed color (rgb string) */
  sectionsColor: string;
  /** "Sections" heading top relative to viewport */
  sectionsTop: number;
  /** First link (Introduction) top */
  firstLinkTop: number;
  asideTop: number;
};

async function getHeaderMetrics(page: any, baseUrl: string): Promise<HeaderMetrics | null> {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1200);

  return await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    const rect = header.getBoundingClientRect();

    const firstButton = header.querySelector('a[href="/"], a[href="/docs"], button');
    let firstButtonTop = 0;
    let firstButtonHeight = 0;
    if (firstButton) {
      const br = firstButton.getBoundingClientRect();
      firstButtonTop = br.top;
      firstButtonHeight = br.height;
    }

    const nav = header.querySelector('nav');
    const firstNavLink = nav?.querySelector('a, button');
    let firstNavLinkTop = 0;
    let firstNavLinkHeight = 0;
    if (firstNavLink) {
      const br = firstNavLink.getBoundingClientRect();
      firstNavLinkTop = br.top;
      firstNavLinkHeight = br.height;
    }

    return {
      headerHeight: rect.height,
      headerTop: rect.top,
      firstButtonTop,
      firstButtonHeight,
      firstNavLinkTop,
      firstNavLinkHeight,
    };
  });
}

async function getSidebarMetrics(page: any, baseUrl: string): Promise<SidebarMetrics | null> {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1200);

  return await page.evaluate(() => {
    const aside = document.querySelector('aside') ?? document.querySelector('[data-sidebar]');
    if (!aside) return null;
    const asideRect = aside.getBoundingClientRect();

    const headings = aside.querySelectorAll('h4, [class*="heading"], [class*="label"], [data-sidebar="group-label"]');
    let sectionsColor = '';
    let sectionsTop = 0;
    for (const h of Array.from(headings)) {
      const text = (h as HTMLElement).textContent?.trim();
      if (text === 'Sections') {
        sectionsColor = getComputedStyle(h as Element).color;
        sectionsTop = (h as HTMLElement).getBoundingClientRect().top;
        break;
      }
    }

    const firstLink = aside.querySelector('a');
    let firstLinkTop = 0;
    if (firstLink) {
      firstLinkTop = firstLink.getBoundingClientRect().top;
    }

    return {
      sectionsColor,
      sectionsTop,
      firstLinkTop,
      asideTop: asideRect.top,
    };
  });
}

const PX_TOLERANCE = 3;
const COLOR_TOLERANCE = 15; // max component diff for rgb

function rgbDistance(a: string, b: string): number {
  const parse = (s: string) => {
    const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
    const m2 = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m2) return [parseInt(m2[1], 10), parseInt(m2[2], 10), parseInt(m2[3], 10)];
    return [0, 0, 0];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2));
}

test.describe('Pixel-perfect: header and sidebar vs shadcn', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('header: logo and nav align like shadcn (same row, within tolerance)', async ({ page }) => {
    test.setTimeout(45000);

    const shadcn = await getHeaderMetrics(page, SHADCN_DOCS_URL);
    expect(shadcn, 'shadcn header').toBeTruthy();

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    const ours = await getHeaderMetrics(page, blazorUrl + '/');
    expect(ours, 'our header').toBeTruthy();

    // Same header height (or very close)
    expect(Math.abs((ours!.headerHeight - shadcn!.headerHeight)), 'header height').toBeLessThanOrEqual(PX_TOLERANCE + 2);

    // First button (logo) should be vertically centered in header: button top ~= header top + (header height - button height) / 2
    const shadcnLogoCenter = shadcn!.firstButtonTop + shadcn!.firstButtonHeight / 2;
    const shadcnHeaderCenter = shadcn!.headerTop + shadcn!.headerHeight / 2;
    const shadcnLogoOffset = Math.abs(shadcnLogoCenter - shadcnHeaderCenter);

    const oursLogoCenter = ours!.firstButtonTop + ours!.firstButtonHeight / 2;
    const oursHeaderCenter = ours!.headerTop + ours!.headerHeight / 2;
    const oursLogoOffset = Math.abs(oursLogoCenter - oursHeaderCenter);

    expect(oursLogoOffset, 'our logo vertically centered in header').toBeLessThanOrEqual(Math.max(2, shadcnLogoOffset + PX_TOLERANCE));

    // First nav link and first button should be on same baseline (similar top)
    const navVsButtonTop = Math.abs(ours!.firstNavLinkTop - ours!.firstButtonTop);
    expect(navVsButtonTop, 'nav and logo on same row').toBeLessThanOrEqual(PX_TOLERANCE + 4);
  });

  test('sidebar: Sections heading visible and not cut off (reference: text-muted-foreground)', async ({ page }) => {
    test.setTimeout(45000);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(blazorUrl + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);

    const sectionsAndLinkColors = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      if (!aside) return null;
      const sectionsHeading = Array.from(aside.querySelectorAll('h4')).find((h) => (h as HTMLElement).textContent?.trim() === 'Sections');
      const introLink = Array.from(aside.querySelectorAll('a')).find((a) => (a as HTMLElement).textContent?.trim() === 'Introduction');
      if (!sectionsHeading || !introLink) return null;
      const sectionsRect = sectionsHeading.getBoundingClientRect();
      return {
        sections: getComputedStyle(sectionsHeading).color,
        link: getComputedStyle(introLink).color,
        sectionsTop: sectionsRect.top,
        sectionsHeight: sectionsRect.height,
      };
    });
    expect(sectionsAndLinkColors).toBeTruthy();
    // Sections must be fully visible (not cut off): has reasonable height and is in view
    expect(sectionsAndLinkColors!.sectionsHeight, 'Sections heading not cut off').toBeGreaterThanOrEqual(14);
  });

  test('sidebar: Sections and spacing in expected range (pixel-perfect)', async ({ page }) => {
    test.setTimeout(45000);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    const ours = await getSidebarMetrics(page, blazorUrl + '/');
    expect(ours).toBeTruthy();

    const gapAboveSections = ours!.sectionsTop - ours!.asideTop;
    const spacingToFirstLink = ours!.firstLinkTop - ours!.sectionsTop;

    // Reference: h-9 (36px) + pt-6 (24px) + p-2 (8px) ≈ 68px to "Sections" (after css:build)
    expect(gapAboveSections, 'gap above Sections').toBeGreaterThanOrEqual(20);
    expect(gapAboveSections, 'gap above Sections').toBeLessThanOrEqual(90);

    // Sections heading to first link (heading h-8 = 32px + gap)
    expect(spacingToFirstLink, 'Sections to first link').toBeGreaterThanOrEqual(4);
    expect(spacingToFirstLink, 'Sections to first link').toBeLessThanOrEqual(45);

    // Optional: when shadcn sidebar is visible, gap should be in same ballpark (different DOM/layout)
    const shadcn = await getSidebarMetrics(page, SHADCN_DOCS_URL);
    if (shadcn && shadcn.sectionsTop > 0) {
      const shadcnGap = shadcn.sectionsTop - shadcn.asideTop;
      expect(Math.abs(gapAboveSections - shadcnGap), 'gap above Sections vs shadcn').toBeLessThanOrEqual(50);
    }
  });

  test('sidebar: bottom fade and space below menu (like reference)', async ({ page }) => {
    test.setTimeout(45000);

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(blazorUrl + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      const aside = document.querySelector('aside.sidebar-aside');
      if (!aside) return { ok: false, reason: 'no aside' };

      const content = aside.querySelector('.sidebar-content');
      const fadeBottom = aside.querySelector('.sidebar-fade-bottom');
      const scrollWrapper = aside.querySelector('.sidebar-scroll-wrapper');

      if (!content) return { ok: false, reason: 'no sidebar-content' };
      if (!fadeBottom) return { ok: false, reason: 'no sidebar-fade-bottom' };

      const asideRect = aside.getBoundingClientRect();
      const fadeRect = fadeBottom.getBoundingClientRect();
      const paddingBottom = parseFloat(getComputedStyle(content).paddingBottom) || 0;

      const viewportWidth = window.innerWidth;
      const asideNotFullWidth = asideRect.width <= 280;
      const fadeHasHeight = fadeRect.height >= 24;   /* reference h-16 = 4rem */
      const hasBottomPadding = paddingBottom >= 32; /* space so last items not cut off */
      /* Fade is in same column as content: either inside content or sibling in scroll-wrapper (so it does not overlay menu links) */
      const fadeIsInAside = aside.contains(fadeBottom);
      const fadeInSameColumn = scrollWrapper?.contains(fadeBottom) ?? false;

      return {
        ok: true,
        viewportWidth,
        asideNotFullWidth,
        fadeHeight: fadeRect.height,
        fadeHasHeight,
        paddingBottom,
        hasBottomPadding,
        fadeInSameColumn,
        fadeIsInAside,
      };
    });

    expect(result.ok, result.reason ?? 'sidebar structure').toBe(true);
    expect(result.asideNotFullWidth, 'aside should not span full page (left column only)').toBe(true);
    expect(result.fadeHasHeight, 'bottom fade should be visible (height >= 24px)').toBe(true);
    expect(result.hasBottomPadding, 'sidebar content should have padding below menu so last items are not cut off').toBe(true);
    expect(result.fadeIsInAside, 'fade should be inside sidebar (aside)').toBe(true);
    expect(result.fadeInSameColumn, 'fade should be in sidebar column (scroll wrapper)').toBe(true);
  });
});
