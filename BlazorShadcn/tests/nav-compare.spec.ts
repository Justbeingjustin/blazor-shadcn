import { test, expect } from '@playwright/test';

const SHADCN_DOCS_URL = 'https://ui.shadcn.com/docs';

type HeaderSnapshot = {
  hasBorderBottom: boolean;
  separatorCount: number;
  navLinkCount: number;
  hasSearch: boolean;
  hasGitHubLink: boolean;
  hasThemeToggle: boolean;
  hasNewProjectButton: boolean;
  rightSectionChildCount: number;
};

async function getHeaderSnapshot(page: any, headerSelector: string): Promise<HeaderSnapshot> {
  const header = page.locator(headerSelector).first();
  await header.waitFor({ state: 'visible', timeout: 10000 });

  return await header.evaluate((el: HTMLElement) => {
    const borderBottom = getComputedStyle(el).borderBottomWidth;
    const hasBorderBottom = parseFloat(borderBottom) > 0;

    const inner = el.querySelector('[class*="flex"]');
    const row = inner?.querySelector('[class*="flex"][class*="items-center"]') ?? inner ?? el;

    const separators = row?.querySelectorAll('[data-slot="separator"], [role="separator"], .bg-border.w-px, [class*="w-px"][class*="bg-border"]') ?? [];
    const separatorCount = separators.length;

    const nav = row?.querySelector('nav');
    const navLinks = nav?.querySelectorAll('a, [role="link"], button') ?? [];
    const navLinkCount = navLinks.length;

    const hasSearch = !!row?.querySelector('input[placeholder*="Search"], input[placeholder*="search"], [cmdk-input]');
    const hasGitHubLink = !!row?.querySelector('a[href*="github"]');
    const hasThemeToggle = !!row?.querySelector('button[aria-label*="theme"], button[aria-label*="Theme"], [data-state]');
    const createLink = row?.querySelector('a[href*="create"]');
    const newButtons = row?.querySelectorAll('a, button');
    const hasNewProjectButton = !!createLink || Array.from(newButtons ?? []).some((n: Element) => (n as HTMLElement).textContent?.trim() === 'New' || (n as HTMLElement).textContent?.trim() === 'New Project');

    const mlAuto = row?.querySelector('[class*="ml-auto"]');
    const rightSectionChildCount = mlAuto ? mlAuto.children.length : 0;

    return {
      hasBorderBottom,
      separatorCount,
      navLinkCount,
      hasSearch,
      hasGitHubLink,
      hasThemeToggle,
      hasNewProjectButton,
      rightSectionChildCount,
    };
  }) as Promise<HeaderSnapshot>;
}

test.describe('Nav bar match shadcn', () => {
  test('header structure matches shadcn (no extra grey dividers)', async ({ page }) => {
    await page.goto(SHADCN_DOCS_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const shadcnHeader = page.locator('header').first();
    await shadcnHeader.waitFor({ state: 'visible', timeout: 8000 });

    const shadcn = await getHeaderSnapshot(page, 'header');
    console.log('Shadcn header:', JSON.stringify(shadcn, null, 2));

    const blazorUrl = process.env['BLAZOR_URL'] || 'http://localhost:5190';
    await page.goto(blazorUrl + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);

    const ours = await getHeaderSnapshot(page, 'header');
    console.log('Our header:', JSON.stringify(ours, null, 2));

    expect(ours.hasSearch, 'has search').toBe(shadcn.hasSearch);
    expect(ours.hasGitHubLink, 'has GitHub link').toBe(shadcn.hasGitHubLink);
    expect(ours.hasThemeToggle, 'has theme toggle').toBe(shadcn.hasThemeToggle);
    expect(ours.hasNewProjectButton, 'has New Project button').toBe(shadcn.hasNewProjectButton);
    expect(ours.navLinkCount, 'nav link count').toBeGreaterThanOrEqual(Math.min(4, shadcn.navLinkCount));

    expect(ours.separatorCount, 'no grey dividers in header').toBe(0);
  });
});
