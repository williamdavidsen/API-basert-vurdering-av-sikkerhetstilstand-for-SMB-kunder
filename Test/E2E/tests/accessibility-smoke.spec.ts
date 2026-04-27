import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import assessmentFixture from '../fixtures/assessment-response.json' with { type: 'json' }

test.describe('accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
      const body = url.includes('/api/assessment/')
        ? assessmentFixture.assessment
        : url.includes('/api/ssl/details/')
          ? {
              ...assessmentFixture.ssl,
              dataSource: 'DIRECT_TLS',
              dataSourceStatus: 'READY',
              endpoints: [],
              certificate: {},
              supportedTlsVersions: ['TLS 1.3'],
              notableCipherSuites: ['TLS_AES_256_GCM_SHA384 (256 bits)'],
            }
          : url.includes('/api/ssl/')
            ? assessmentFixture.ssl
            : url.includes('/api/headers/')
              ? assessmentFixture.headers
              : url.includes('/api/email/')
                ? assessmentFixture.email
                : url.includes('/api/reputation/')
                  ? assessmentFixture.reputation
                  : assessmentFixture.assessment

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })
  })

  test('home page keeps a labelled scan form and a stable aria tree', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('textbox', { name: /enter domain name/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /run security scan/i })).toBeVisible()

    await expect(page.getByRole('region', { name: /analyse your security posture/i })).toMatchAriaSnapshot(`
      - region "Analyse your security posture":
        - heading "Analyse your security posture" [level=2]
        - text: Enter domain name
        - textbox "Enter domain name":
          - /placeholder: e.g. firma.no
        - paragraph: You can enter a full URL or a domain like firma.no
        - button "Run security scan"
    `)
  })

  test('scan progress page announces progress updates', async ({ page }) => {
    await page.goto('/scan?domain=example.com')

    await expect(page.getByText(/domain security assessment in progress/i)).toBeVisible()
    await expect(page.locator('[aria-live="polite"]')).toHaveCount(2)
    await expect(page.getByRole('button', { name: /^cancel$/i })).toBeVisible()
  })

  test('dashboard and module detail pages expose headings and readable actions', async ({ page }) => {
    await page.goto('/dashboard?domain=example.com')

    await expect(page.getByRole('heading', { level: 2, name: /security analysis dashboard/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /post-quantum insight/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /read more/i }).first()).toBeVisible()

    await page.getByRole('link', { name: /read more/i }).first().click()

    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /back to results/i })).toBeVisible()
  })

  test('key pages stay free of serious axe violations', async ({ page }) => {
    const urls = ['/', '/scan?domain=example.com', '/dashboard?domain=example.com', '/dashboard/example.com/ssl-tls']

    for (const url of urls) {
      await page.goto(url)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      const seriousOrCritical = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      )

      expect(seriousOrCritical, `Axe violations on ${url}`).toEqual([])
    }
  })
})
