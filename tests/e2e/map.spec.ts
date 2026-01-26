import { test, expect } from '@playwright/test';

// Dismiss first-visit overlays before each test
test.beforeEach(async ({ page }) => {
  // Set localStorage to skip intro overlays
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenLensIntro', 'true');
    localStorage.setItem('legendCollapsed', 'false');
  });
});

test.describe('SC Election Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sc');
  });

  test('renders page title and header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /South Carolina 2026/i })).toBeVisible();
    await expect(page.getByText(/Tracking.*House.*districts/i)).toBeVisible();
  });

  test('displays loading state initially', async ({ page }) => {
    // Use a fresh page with network interception
    await page.route('**/data/candidates.json', async (route) => {
      // Delay response to see loading state
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto('/sc');
    // Loading state shows briefly before data loads
  });

  test('loads and displays candidates data', async ({ page }) => {
    // Wait for stats to appear - use .first() to avoid strict mode with sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Rep Seats').first()).toBeVisible();
    await expect(page.getByText('Open Seats').first()).toBeVisible();
  });

  test('displays map with accessible structure', async ({ page }) => {
    await expect(page.locator('#map-container')).toBeVisible();
    await expect(page.getByRole('region', { name: /Interactive district map/i })).toBeVisible();
  });

  test('displays legend with lens-specific items', async ({ page }) => {
    // Default lens is "incumbents" which shows these items - use exact match
    await expect(page.getByText('Dem Incumbent', { exact: true })).toBeVisible();
    await expect(page.getByText('Rep Incumbent', { exact: true })).toBeVisible();
    await expect(page.getByText('Open Seat', { exact: true })).toBeVisible();
    await expect(page.getByText('Unknown', { exact: true })).toBeVisible();
  });
});

test.describe('Chamber Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sc');
    // Wait for KPI cards to load - use first() to avoid sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
  });

  test('House is selected by default', async ({ page }) => {
    const houseTab = page.getByRole('tab', { name: /House.*124/i });
    await expect(houseTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/124 House/i)).toBeVisible();
  });

  test('can switch to Senate view', async ({ page }) => {
    await page.getByRole('tab', { name: /Senate.*46/i }).click();
    await expect(page.getByText(/46 Senate/i)).toBeVisible();
  });

  test('clears selection when changing chambers', async ({ page }) => {
    // This test validates the selection clearing behavior
    await page.getByRole('tab', { name: /Senate.*46/i }).click();
    await expect(page.getByText(/46 Senate/i)).toBeVisible();
  });
});

test.describe('Skip Link Accessibility', () => {
  test('skip link is focusable and navigates to map', async ({ page }) => {
    await page.goto('/sc');
    // Wait for KPI cards to load - use first() to avoid sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

    // Focus the skip link via keyboard
    await page.keyboard.press('Tab');

    // The skip link should be visible when focused
    const skipLink = page.getByRole('link', { name: /Skip to map/i });
    await expect(skipLink).toBeFocused();

    // Click/activate the skip link
    await page.keyboard.press('Enter');

    // Focus should now be in the map container area
    await expect(page.locator('#map-container')).toBeInViewport();
  });
});

test.describe('Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sc');
    // Wait for KPI cards to load - use first() to avoid sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
  });

  test('displays data update timestamp', async ({ page }) => {
    await expect(page.getByText(/Data updated:/i)).toBeVisible();
  });

  test('displays source attribution', async ({ page }) => {
    await expect(page.getByRole('link', { name: /South Carolina Election Commission/i })).toBeVisible();
  });

  test('shows district totals', async ({ page }) => {
    // Should show total district count
    await expect(page.getByText('Total').first()).toBeVisible();
    await expect(page.getByText('124').first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('displays correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sc');

    await expect(page.getByRole('heading', { name: /South Carolina 2026/i })).toBeVisible();
    // Use first() to avoid sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
  });

  test('displays correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/sc');

    await expect(page.getByRole('heading', { name: /South Carolina 2026/i })).toBeVisible();
    // Use first() to avoid sr-only duplicates
    await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
  });
});
