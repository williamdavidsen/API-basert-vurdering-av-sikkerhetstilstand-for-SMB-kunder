import { expect, test } from '@playwright/test'

const liveDomain = process.env.LIVE_E2E_DOMAIN?.trim()

test.skip(!liveDomain, 'Set LIVE_E2E_DOMAIN to run the live full-stack smoke test.')

test('live full-stack smoke reaches the dashboard with a real backend flow', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/enter domain name/i).fill(liveDomain!)
  await page.getByRole('button', { name: /run security scan/i }).click()

  await expect(page).toHaveURL(/scan|dashboard/, { timeout: 15_000 })
  await expect(page.getByText(new RegExp(liveDomain!.replace('.', '\\.'), 'i')).first()).toBeVisible({ timeout: 25_000 })
})
