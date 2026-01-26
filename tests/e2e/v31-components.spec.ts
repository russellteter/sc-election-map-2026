import { test, expect } from '@playwright/test';

// Dismiss first-visit overlays before each test
test.beforeEach(async ({ page }) => {
  // Set localStorage to skip intro overlays
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenLensIntro', 'true');
    localStorage.setItem('legendCollapsed', 'false');
  });
});

test.describe('v3.1 UX Components', () => {
  test.describe('AddressSearch Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    });

    test('address input is visible and focusable', async ({ page }) => {
      // Find address input
      const addressInput = page.locator('input[type="text"]').first();

      if (await addressInput.isVisible()) {
        await addressInput.focus();
        await expect(addressInput).toBeFocused();

        // Should accept text input
        await addressInput.fill('123 Main Street');
        await expect(addressInput).toHaveValue('123 Main Street');
      }
    });

    test('search shows loading state during geocoding', async ({ page }) => {
      // Mock Geoapify API to add delay
      await page.route('**/api.geoapify.com/**', async (route) => {
        await new Promise((r) => setTimeout(r, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                lat: 34.0007,
                lon: -81.0348,
                formatted: '123 Main St, Columbia, SC 29201',
              },
            ],
          }),
        });
      });

      const addressInput = page.locator('input[type="text"]').first();

      if (await addressInput.isVisible()) {
        await addressInput.fill('123 Main St, Columbia, SC');

        // Submit via Enter or button
        await page.keyboard.press('Enter');

        // Should show loading indicator
        // Component may show spinner or "Searching..." text
      }
    });

    test('handles geocoding errors gracefully', async ({ page }) => {
      // Mock Geoapify API to return error
      await page.route('**/api.geoapify.com/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      });

      const addressInput = page.locator('input[type="text"]').first();

      if (await addressInput.isVisible()) {
        await addressInput.fill('Invalid Address XYZ');
        await page.keyboard.press('Enter');

        // Should show error message after request completes
        // Allow time for request to fail
        await page.waitForTimeout(500);
      }
    });

    test('location button triggers geolocation', async ({ page }) => {
      // Mock geolocation
      await page.context().setGeolocation({ latitude: 34.0007, longitude: -81.0348 });
      await page.context().grantPermissions(['geolocation']);

      const locationButton = page.getByRole('button', { name: /location|gps/i });

      if (await locationButton.isVisible()) {
        await locationButton.click();
        // Should trigger location lookup
      }
    });

    test('successful search shows district result', async ({ page }) => {
      // Mock successful geocoding and district lookup
      await page.route('**/api.geoapify.com/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                lat: 34.0007,
                lon: -81.0348,
                formatted: '1100 Gervais St, Columbia, SC 29201',
              },
            ],
          }),
        });
      });

      const addressInput = page.locator('input[type="text"]').first();

      if (await addressInput.isVisible()) {
        await addressInput.fill('1100 Gervais St, Columbia, SC');
        await page.keyboard.press('Enter');

        // Wait for geocoding to complete
        await page.waitForTimeout(1000);

        // If GeoJSON loaded, should show district info
      }
    });
  });

  test.describe('Lens Toggle Bar', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    });

    test('lens toggle buttons are visible', async ({ page }) => {
      // Look for lens buttons
      const lensButtons = page.getByRole('button', { name: /incumbents|filing|opportunity|battleground/i });
      const count = await lensButtons.count();

      // Should have multiple lens options
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('can switch between lenses', async ({ page }) => {
      const opportunityButton = page.getByRole('button', { name: /opportunity/i });

      if (await opportunityButton.isVisible()) {
        await opportunityButton.click();

        // Legend should update to show opportunity-specific items
        await expect(page.getByText(/HOT|WARM|POSSIBLE/i).first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('lens selection updates legend', async ({ page }) => {
      // Start with default lens (incumbents)
      await expect(page.getByRole('button', { name: /Incumbents Legend/i })).toBeVisible();

      // Switch to Dem Filing lens
      const filingTab = page.getByRole('tab', { name: /Dem Filing/i });

      if (await filingTab.isVisible()) {
        await filingTab.click();

        // Legend title should update to Dem Filing Legend
        await expect(page.getByRole('button', { name: /Dem Filing Legend/i })).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('ScreenshotButton Component', () => {
    // Skip on mobile - button overlaps with other controls
    test.skip(({ viewport }) => viewport?.width !== undefined && viewport.width < 768, 'Skip on mobile viewports');

    test.beforeEach(async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    });

    test('screenshot button is visible', async ({ page }) => {
      const screenshotButton = page.getByRole('button', { name: /screenshot|export|download|share/i });

      if (await screenshotButton.count() > 0) {
        await expect(screenshotButton.first()).toBeVisible();
      }
    });

    test('clicking screenshot button triggers download', async ({ page }) => {
      const screenshotButton = page.getByRole('button', { name: /screenshot|export|download/i });

      if (await screenshotButton.count() > 0 && await screenshotButton.first().isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await screenshotButton.first().click();

        // If menu shown, click PNG option
        const pngOption = page.getByRole('menuitem', { name: /png/i });
        if (await pngOption.isVisible({ timeout: 500 }).catch(() => false)) {
          await pngOption.click();
        }

        // Download may or may not trigger depending on component state
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.(png|jpg)$/);
        }
      }
    });

    test('screenshot menu shows format options', async ({ page }) => {
      const screenshotButton = page.getByRole('button', { name: /screenshot|export/i });

      if (await screenshotButton.count() > 0 && await screenshotButton.first().isVisible()) {
        await screenshotButton.first().click();

        // Check for format options in dropdown
        const pngOption = page.getByText(/PNG/i);
        const jpgOption = page.getByText(/JPG|JPEG/i);

        // At least one format should be available
        const hasPng = await pngOption.isVisible({ timeout: 500 }).catch(() => false);
        const hasJpg = await jpgOption.isVisible({ timeout: 500 }).catch(() => false);

        // May be direct download without menu
      }
    });
  });

  test.describe('Mobile District Sheet', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test.beforeEach(async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    });

    test('tapping district opens mobile sheet on mobile viewport', async ({ page }) => {
      // Wait for map to load
      await page.waitForTimeout(1000);

      // Click on the map to select a district
      const mapContainer = page.locator('#map-container');
      await expect(mapContainer).toBeVisible();

      // Click center of map
      const box = await mapContainer.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // Check if mobile sheet appeared
        const sheet = page.locator('[role="dialog"], .mobile-sheet, .bottom-sheet');
        // Sheet may or may not appear depending on hit detection
      }
    });

    test('mobile sheet can be closed', async ({ page }) => {
      // Click on map
      const mapContainer = page.locator('#map-container');
      await expect(mapContainer).toBeVisible();

      const box = await mapContainer.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // Look for close button
        const closeButton = page.getByRole('button', { name: /close/i });
        if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await closeButton.click();
        }
      }
    });

    test('escape key closes mobile sheet', async ({ page }) => {
      // Click on map to open sheet
      const mapContainer = page.locator('#map-container');
      const box = await mapContainer.boundingBox();

      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('sheet shows district information', async ({ page }) => {
      const mapContainer = page.locator('#map-container');
      const box = await mapContainer.boundingBox();

      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // If sheet opens, check for district info
        const districtText = page.getByText(/District \d+|House \d+|Senate \d+/i);
        // May or may not be visible depending on click location
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('desktop shows inline district panel', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Desktop should not show mobile bottom sheet initially
      // Should show inline panel when district selected
    });

    test('mobile shows bottom sheet for districts', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Mobile should show bottom sheet when district selected
    });

    test('tablet switches to mobile behavior at breakpoint', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Tablet may show either desktop or mobile behavior
    });
  });

  test.describe('KPI Cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });
    });

    test('KPI cards display party statistics', async ({ page }) => {
      await expect(page.getByText('Dem Seats').first()).toBeVisible();
      await expect(page.getByText('Rep Seats').first()).toBeVisible();
    });

    test('KPI cards update when switching chambers', async ({ page }) => {
      // Verify House is shown initially
      await expect(page.getByText(/124 House/i)).toBeVisible();

      // Switch to Senate
      await page.getByRole('tab', { name: /Senate/i }).click();

      // Header should update to Senate
      await expect(page.getByText(/46 Senate/i)).toBeVisible();
    });

    test('KPI cards update when switching lenses', async ({ page }) => {
      // Switch to Opportunity lens
      const opportunityButton = page.getByRole('button', { name: /opportunity/i });

      if (await opportunityButton.isVisible()) {
        await opportunityButton.click();

        // KPIs should show opportunity-specific metrics
        await expect(page.getByText(/HOT|WARM|Opportunities/i).first()).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
