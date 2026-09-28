import { Page } from "@playwright/test";

export async function navigateToPage(
  page: Page,
  url: string
): Promise<void> {
  console.log(`Navigating to: ${url}`);

  // Playwright follows normal HTTP redirects automatically.
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  await page.waitForLoadState('load').catch(() => {});

  // Give client-side navigation/redirects a chance to settle.
  await page.waitForLoadState('networkidle', {
    timeout: 30_000,
  }).catch(() => {});

  await page.waitForTimeout(1_000);

  console.log(`Final URL: ${page.url()}`);
}

function normaliseUrl(url: string): string {
  const parsed = new URL(url);

  // Hash fragments are not relevant to page migration.
  parsed.hash = '';

  // Treat /foo and /foo/ as the same URL.
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  return parsed.toString();
}

export function urlMatches(
  actualUrl: string,
  expectedUrl: string
): boolean {
  return normaliseUrl(actualUrl) === normaliseUrl(expectedUrl);
}