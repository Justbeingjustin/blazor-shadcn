# Playwright comparison tests

## Button test

Compares the outline "Button" and outline icon button on our `/components/button` page with [ui.shadcn.com/docs/components/button](https://ui.shadcn.com/docs/components/button). Asserts height, padding, and border radius match within 1.5px.

## Nav test

Compares the site header with [ui.shadcn.com/docs](https://ui.shadcn.com/docs): asserts no grey vertical dividers in the header, and that search, GitHub link, theme toggle, and New Project button are present (when shadcn has them).

## Sidebar test

Compares the left sidebar and layout toggle with shadcn docs: asserts the sidebar has sections and links, and that a layout-toggle button (sidebar trigger) exists in the main content area. A second test verifies that the "Introduction" link has the same computed font (family, size, weight) as other sidebar links and matches shadcn.

## Separator test

Compares horizontal and vertical separators on our `/components/separator` page with [ui.shadcn.com/docs/components/separator](https://ui.shadcn.com/docs/components/separator). Asserts separator thickness and color match within tolerance.

## Accordion test

Compares main accordion trigger metrics on our `/components/accordion` page with [ui.shadcn.com/docs/components/accordion](https://ui.shadcn.com/docs/components/accordion), validates single-collapsible interaction behavior, and verifies disabled item plus docs pager/copy controls.

## Run the tests

1. **Start the Blazor app** (from `BlazorShadcn` folder):
   ```bash
   dotnet run
   ```
2. In another terminal (from `BlazorShadcn` folder):
   ```bash
   npm run test:button
   npm run test:accordion
   npm run test:separator
   npm run test:nav
   npm run test:sidebar
   ```
   Or with a custom URL:
   ```bash
   $env:BLAZOR_URL="http://localhost:5190"; npx playwright test tests/button-compare.spec.ts
   $env:BLAZOR_URL="http://localhost:5190"; npx playwright test tests/nav-compare.spec.ts
   ```

## First-time setup

From `BlazorShadcn` folder:

```bash
npm install
npx playwright install chromium
```

Port is set in `playwright.config.ts` (default `http://localhost:5190` from `launchSettings.json`).
