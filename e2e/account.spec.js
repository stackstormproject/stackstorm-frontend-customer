import { test, expect } from '@playwright/test';
import { addFirstAvailableItem, fillAddress, pay, uniqueEmail } from './helpers';

const PASSWORD = 'Shopper123';

// Critical flow 2 (FR035, FR009, FR010): register, buy with a saved address, find the order,
// and keep the session across a reload.
test('new customer registers, buys, tracks the order and stays signed in', async ({ page }) => {
  const email = uniqueEmail('customer');
  // Without ?next the shopper lands on the home page (#187).
  await page.goto('/register?next=%2Faccount');
  await page.getByLabel('Full name').fill('E2E Shopper');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, E2E' })).toBeVisible();

  await addFirstAvailableItem(page);
  await page.getByRole('dialog').getByRole('link', { name: 'Check out' }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await fillAddress(page);
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await pay(page);
  await expect(page.getByRole('heading', { name: /your order is placed/ })).toBeVisible();

  await page.getByRole('link', { name: 'Track this order' }).click();
  await expect(page.getByRole('heading', { name: 'Tracking' })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText('Confirmed & Processing');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tracking' })).toBeVisible();

  await page.goto('/account/addresses');
  await expect(page.getByText('12 Main Street')).toBeVisible();
  await expect(page.getByText('Default address')).toBeVisible();
});

// Critical flow 3: a guest's bag follows them into their account.
test('guest bag is merged into the account after signing in', async ({ page }) => {
  const email = uniqueEmail('merge');
  // Without ?next the shopper lands on the home page (#187).
  await page.goto('/register?next=%2Faccount');
  await page.getByLabel('Full name').fill('Merge Shopper');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();

  await addFirstAvailableItem(page);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByRole('button', { name: /Shopping bag, [1-9]/ })).toBeVisible();
});

test('protected pages send guests to sign in and back', async ({ page }) => {
  await page.goto('/account/orders');

  await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount%2Forders$/);
});
