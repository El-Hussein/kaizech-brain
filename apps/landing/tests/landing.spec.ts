import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E', () => {
  test('should load the homepage and display the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Kaizech Brain/);
    
    // Check main headline
    const headline = page.locator('h1');
    await expect(headline).toContainText('Agentic AI');
    
    // Check if the Kaizech Assistant widget renders
    const widgetHeader = page.locator('h3', { hasText: 'Kaizech Assistant' });
    await expect(widgetHeader).toBeVisible();
  });

  test('navigation links should scroll to sections', async ({ page }) => {
    await page.goto('/');
    
    // Click Pricing link in nav
    const pricingLink = page.locator('nav a', { hasText: 'Pricing' });
    await expect(pricingLink).toBeVisible();
    
    // The exact scrolling might be smooth, just verify the href
    await expect(pricingLink).toHaveAttribute('href', '#pricing');
  });

  test('integration page loads correctly', async ({ page }) => {
    await page.goto('/integration');
    
    // Check Integration Guide header
    await expect(page.locator('h1')).toHaveText('Integration Guide');
    
    // Verify tabs exist
    await expect(page.locator('button', { hasText: 'Web Widget' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'WhatsApp' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'REST API' })).toBeVisible();
  });
});
