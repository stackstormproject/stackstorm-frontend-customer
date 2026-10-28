import { expect } from '@playwright/test';

/** Unique per run so tests never collide with existing accounts. */
export const uniqueEmail = (prefix) =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.lk`;

export const ADDRESS = {
  line1: '12 Main Street',
  city: 'Dickwella',
  postalCode: '81200',
  district: 'Matara',
};

/** Opens the first in-stock product of the catalog and adds its first available size. */
export async function addFirstAvailableItem(page) {
  await page.goto('/shop');
  await page
    .getByRole('article')
    .filter({ hasText: /In stock|left/ })
    .first()
    .getByRole('link')
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const sizes = page.getByRole('group', { name: 'Size' }).getByRole('button', { disabled: false });
  if (
    (await sizes.count()) > 0 &&
    (await page.getByRole('button', { name: 'Add to bag' }).isVisible())
  ) {
    const selected = page.getByRole('group', { name: 'Size' }).locator('[aria-pressed="true"]');
    if ((await selected.count()) === 0) await sizes.first().click();
  }
  await page.getByRole('button', { name: 'Add to bag' }).click();
  await expect(page.getByRole('dialog', { name: /Your bag/ })).toBeVisible();
}

export async function fillAddress(page) {
  await page.getByLabel('Street address').fill(ADDRESS.line1);
  await page.getByLabel('Town or city').fill(ADDRESS.city);
  await page.getByLabel('Postal code').fill(ADDRESS.postalCode);
  await page.getByLabel('District').selectOption(ADDRESS.district);
}

/**
 * Pays on the payment step. Uses the test-mode button when the environment has no Stripe
 * key; with Stripe it enters the 4242 test card inside the Stripe iframe.
 */
export async function pay(page) {
  // Wait until the payment step has decided which provider it shows.
  await expect(page.getByRole('button', { name: /Place test order|^Pay LKR/ })).toBeVisible();
  const testButton = page.getByRole('button', { name: /Place test order/ });
  if (await testButton.isVisible()) {
    await testButton.click();
    return;
  }
  const card = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await card.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await card.getByPlaceholder('MM / YY').fill('12 / 34');
  await card.getByPlaceholder('CVC').fill('123');
  await page.getByRole('button', { name: /^Pay LKR/ }).click();
}
