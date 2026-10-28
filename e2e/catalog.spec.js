import { test, expect } from '@playwright/test';

// FR001-FR004: discovery works on desktop and phone sizes.
test('catalog filters live in the URL and survive a reload', async ({ page, isMobile }) => {
  await page.goto('/shop');
  await expect(page.getByRole('status')).toContainText('products');
  if (isMobile) await page.getByRole('button', { name: /^Filters/ }).click();

  await page
    .getByRole('group', { name: 'Size' })
    .getByRole('button', { name: 'M', exact: true })
    .click();
  await expect(page).toHaveURL(/size=M/);
  await page.reload();

  if (isMobile) await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(
    page.getByRole('group', { name: 'Size' }).getByRole('button', { name: 'M', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('search finds batik products', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('batik');
  await page.getByRole('searchbox', { name: 'Search products' }).press('Enter');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for "batik"');
  await expect(page.getByRole('article').first()).toBeVisible();
});

test('product page shows stock per size and an unknown product shows not found', async ({
  page,
}) => {
  await page.goto('/shop');
  await page.getByRole('article').first().getByRole('link').first().click();
  await expect(page.getByRole('group', { name: 'Size' })).toBeVisible();

  await page.goto('/products/this-product-does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
});

test('no horizontal scrolling on the main pages', async ({ page }) => {
  for (const path of ['/', '/shop', '/checkout', '/sign-in']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
