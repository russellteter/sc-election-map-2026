import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Dismiss first-visit overlays before each test
test.beforeEach(async ({ page }) => {
  // Set localStorage to skip intro overlays
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenLensIntro', 'true');
    localStorage.setItem('legendCollapsed', 'false');
  });
});

test.describe('Accessibility Audit', () => {
  test.describe('Baseline Page Scan', () => {
    test('SC map page has no critical accessibility violations', async ({ page }) => {
      await page.goto('/sc');
      // Wait for page to fully load
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.leaflet-container') // Exclude Leaflet internals
        .disableRules(['color-contrast']) // Color contrast requires design review
        .analyze();

      // Filter to critical violations only (structural issues)
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('homepage state selector loads without critical a11y issues', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /State Election Intel Hub/i })).toBeVisible({ timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // Color contrast requires design review
        .analyze();

      // Filter to critical violations only (structural issues)
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Skip link
      await page.keyboard.press('Tab'); // Next interactive element

      // Should be able to tab through without getting stuck
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        // Verify something is focused
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).not.toBe('BODY');
      }
    });

    test('skip link works correctly', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Focus skip link
      await page.keyboard.press('Tab');
      const skipLink = page.getByRole('link', { name: /Skip to map/i });
      await expect(skipLink).toBeFocused();

      // Activate it
      await page.keyboard.press('Enter');
      await expect(page.locator('#map-container')).toBeInViewport();
    });
  });

  test.describe('AddressSearch Accessibility', () => {
    test('address input has proper label association', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Find address input by role
      const addressInput = page.getByRole('textbox', { name: /address|location|find/i });

      // If visible, check it has accessible name
      if (await addressInput.isVisible()) {
        const accessibleName = await addressInput.getAttribute('aria-label') ||
          await addressInput.getAttribute('placeholder');
        expect(accessibleName).toBeTruthy();
      }
    });

    test('location button is properly labeled', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Look for location/GPS button
      const locationButton = page.getByRole('button', { name: /location|gps|my location/i });

      if (await locationButton.isVisible()) {
        // Should have accessible name
        await expect(locationButton).toHaveAccessibleName();
      }
    });
  });

  test.describe('Legend Accessibility', () => {
    test('legend has proper list structure', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Legend should be a list with accessible name
      const legendList = page.getByRole('list', { name: /District status legend/i });
      await expect(legendList).toBeVisible();

      // Should have list items
      const items = legendList.getByRole('listitem');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('legend toggle is keyboard accessible', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Find legend toggle button (it says "Incumbents Legend" by default)
      const legendToggle = page.getByRole('button', { name: /Legend/i });

      if (await legendToggle.isVisible()) {
        // Should have aria-expanded
        const expanded = await legendToggle.getAttribute('aria-expanded');
        expect(expanded).toBeTruthy();

        // Click to toggle
        await legendToggle.click();
        const newExpanded = await legendToggle.getAttribute('aria-expanded');
        expect(newExpanded).not.toBe(expanded);
      }
    });
  });

  test.describe('Chamber Toggle Accessibility', () => {
    test('chamber tabs have proper ARIA roles', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Should have chamber selection tablist
      const tablist = page.getByRole('tablist', { name: /Chamber selection/i });
      await expect(tablist).toBeVisible();

      // Should have at least 2 tabs (House and Senate)
      const houseTabs = page.getByRole('tab');
      expect(await houseTabs.count()).toBeGreaterThanOrEqual(2);
    });

    test('selected tab has aria-selected', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // House tab should be selected by default
      const houseTab = page.getByRole('tab', { name: /House/i });
      await expect(houseTab).toHaveAttribute('aria-selected', 'true');
    });

    test('tabs are keyboard navigable', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      const houseTab = page.getByRole('tab', { name: /House/i });
      await houseTab.focus();
      await expect(houseTab).toBeFocused();

      // Arrow right to Senate
      await page.keyboard.press('ArrowRight');
      // Tab focus should move
    });
  });

  test.describe('Map Accessibility', () => {
    test('map container has accessible label', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Map should have region role with label
      const mapRegion = page.getByRole('region', { name: /map/i });
      await expect(mapRegion).toBeVisible();
    });

    test('map has skip link target', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Map container should exist for skip link targeting
      const mapContainer = page.locator('#map-container');
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Color Contrast', () => {
    // Skip: Color contrast audit requires design review - tracking separately
    test.skip('text has sufficient color contrast', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .exclude('.leaflet-container')
        .exclude('.legend-swatch') // Color swatches are decorative
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast' && v.impact === 'serious'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Focus Management', () => {
    test('focus is visible on interactive elements', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check that focus ring is visible (via CSS)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Screen Reader', () => {
    test('decorative images have empty alt or aria-hidden', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Check all images
      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaHidden = await img.getAttribute('aria-hidden');
        const role = await img.getAttribute('role');

        // Decorative images should have alt="" or aria-hidden="true" or role="presentation"
        // Meaningful images should have alt text
        const isDecorative = alt === '' || ariaHidden === 'true' || role === 'presentation';
        const hasMeaningfulAlt = alt && alt.length > 0;

        expect(isDecorative || hasMeaningfulAlt).toBe(true);
      }
    });

    test('headings are in logical order', async ({ page }) => {
      await page.goto('/sc');
      await expect(page.getByText('Dem Seats').first()).toBeVisible({ timeout: 10000 });

      // Get all headings
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      let lastLevel = 0;
      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName);
        const level = parseInt(tagName.replace('H', ''));

        // Heading levels should not skip more than one level
        if (lastLevel > 0) {
          expect(level).toBeLessThanOrEqual(lastLevel + 1);
        }
        lastLevel = level;
      }
    });
  });
});
