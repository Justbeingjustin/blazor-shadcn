# blazor-shadcn

Beautifully designed components for Blazor, ported from [shadcn/ui](https://ui.shadcn.com). **You own the code.** Copy and paste into your apps. Open source.

## Philosophy

This is NOT a component library. It's a collection of reusable components that you copy and paste into your project. You own every line of code. Modify it however you like.

This follows the same philosophy as [shadcn/ui](https://ui.shadcn.com) - the original React component collection.

This repo has a single Blazor implementation path. The docs do not use a `Radix UI / Base UI` switch.

## Components

| Component | Description |
|-----------|-------------|
| Button | Displays a button with multiple variants (default, secondary, destructive, outline, ghost, link) and sizes |
| Card | Displays a card with header, content, and footer sub-components |
| Input | A styled text input field |
| Label | A styled form label |

## Getting Started

### Prerequisites

- .NET 10 SDK (or 8+)
- Node.js (for Tailwind CSS build)

### Setup

```bash
cd BlazorShadcn
npm install
dotnet run
```

The project uses Tailwind CSS v4 with the exact same design tokens as shadcn/ui. Tailwind CSS is built automatically during `dotnet build`.

### Manual setup in a new Blazor app (copy/paste workflow)

If you want to create a fresh Blazor app and then copy a component like `Button.razor`, follow these exact steps.

1) Create app and install Tailwind CLI

```bash
dotnet new blazor -n MyApp
cd MyApp
npm init -y
npm install -D tailwindcss @tailwindcss/cli
```

2) Add scripts to `package.json`

```json
{
  "private": true,
  "scripts": {
    "css:build": "npx @tailwindcss/cli -i ./Styles/globals.css -o ./wwwroot/tailwind.css --minify",
    "css:watch": "npx @tailwindcss/cli -i ./Styles/globals.css -o ./wwwroot/tailwind.css --watch"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4",
    "tailwindcss": "^4"
  }
}
```

3) Create `Styles/globals.css`

```css
@import "tailwindcss";

@source "../Components/**/*.razor";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
}
```

4) Add Tailwind build target to `MyApp.csproj`

```xml
<Target Name="BuildTailwindCSS" BeforeTargets="Build">
  <Exec Command="npx @tailwindcss/cli -i ./Styles/globals.css -o ./wwwroot/tailwind.css --minify" />
</Target>
```

5) Update `Components/App.razor`

- Add Geist font links.
- Add `<link rel="stylesheet" href="@Assets["tailwind.css"]" />`.
- Keep `app.css` and `MyApp.styles.css`.
- Remove Bootstrap CSS link (`lib/bootstrap/dist/css/bootstrap.min.css`) to avoid utility-class conflicts with shadcn classes.
- Add `class="min-h-screen font-sans antialiased"` on `<body>`.

6) Copy the component and import namespace

- Copy `BlazorShadcn/Components/UI/Button.razor` to `MyApp/Components/UI/Button.razor`.
- Add `@using MyApp.Components.UI` to `MyApp/Components/_Imports.razor`.

7) Build and run

```bash
dotnet build
dotnet run
```

You can now drop `<Button>` into any page and it will render with shadcn-matching styles.

### Using Components

Copy the component files from `Components/UI/` into your own project's component folder. Make sure you have:

1. Tailwind CSS v4 configured
2. The shadcn theme CSS variables (see `Styles/globals.css`)
3. Any component-specific enums or helpers included in the copied component file

```razor
<Button Variant="ButtonVariant.Outline">Click me</Button>

<Card>
    <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent>Content here</CardContent>
    <CardFooter>Footer</CardFooter>
</Card>
```

## Tech Stack

- **Blazor** (.NET 10) — Server-side rendering
- **Tailwind CSS v4** — Utility-first CSS with the shadcn theme
- **oklch colors** — Modern color space matching shadcn/ui exactly

## License

MIT

