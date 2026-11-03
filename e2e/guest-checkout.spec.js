import { test, expect } from '@playwright/test';
import { addFirstAvailableItem, fillAddress, pay, uniqueEmail } from './helpers';

// Critical flow 1 (UC-003): a guest browses, adds to bag, checks out and pays.
test('guest can buy a product and see the confirmation', async ({ page }) => {
  await addFirstAvailableItem(page);
  await page.getByRole('dialog').getByRole('link', { name: 'Check out' }).click();

  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await page.getByLabel('Email for your receipt').fill(uniqueEmail('guest'));
  await fillAddress(page);
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  // #182: the shopper pays on the hosted payment page, then comes back to the confirmation.
  await pay(page);

  await expect(page.getByRole('heading', { name: /your order is placed/ })).toBeVisible();
  await expect(page).toHaveURL(/\/orders\/\d+\/confirmation$/);
  await expect(page.getByText(/Being prepared/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Shopping bag, 0 items' })).toBeVisible();
});

test('checkout refuses an invalid postal code before any order is created', async ({ page }) => {
  await addFirstAvailableItem(page);
  await page.goto('/checkout');
  await page.getByLabel('Email for your receipt').fill(uniqueEmail('guest'));
  await page.getByLabel('Street address').fill('12 Main Street');
  await page.getByLabel('Town or city').fill('Dickwella');
  await page.getByLabel('Postal code').fill('812');
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  await expect(
    page.getByText('Postal codes in Sri Lanka have 5 digits, e.g. 81200.')
  ).toBeVisible();
  await expect(page.getByText('Your items are held for')).toHaveCount(0);
});
