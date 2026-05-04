import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAssessmentCheck,
  fetchAssessmentDashboardBundle,
  fetchSslDetails,
} from '../../../../Frontend/dashboard/src/features/assessment/services/assessment.api'

describe('assessment api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes input and calls all dashboard endpoints with the same encoded domain', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes('/assessment/')
        ? { domain: 'example.com', overallScore: 90, status: 'PASS', grade: 'A', maxScore: 100, emailModuleIncluded: true, pqcReadiness: { status: 'INFO' }, weights: {}, modules: {}, alerts: [] }
        : url.includes('/ssl/')
          ? { domain: 'example.com', overallScore: 30, maxScore: 30, status: 'PASS', criteria: {}, alerts: [] }
          : url.includes('/headers/')
            ? { domain: 'example.com', overallScore: 10, maxScore: 10, status: 'PASS', criteria: {}, observatory: {}, alerts: [] }
            : url.includes('/email/')
              ? { domain: 'example.com', hasMailService: true, moduleApplicable: true, overallScore: 20, maxScore: 20, status: 'PASS', criteria: {}, dnsSummary: {}, alerts: [] }
              : { domain: 'example.com', overallScore: 20, maxScore: 20, status: 'PASS', criteria: {}, summary: {}, alerts: [] }

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    await fetchAssessmentDashboardBundle('https://example.com/path')

    expect(fetchMock).toHaveBeenCalledTimes(5)
    for (const [input] of fetchMock.mock.calls) {
      expect(String(input)).toContain('example.com')
      expect(String(input)).not.toContain('/path')
    }
  })

  it('starts dashboard detail requests without waiting for the assessment response', async () => {
    let resolveAssessment!: (response: Response) => void
    const assessmentResponse = new Promise<Response>((resolve) => {
      resolveAssessment = resolve
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/assessment/')) {
        return assessmentResponse
      }

      const body = url.includes('/ssl/')
        ? { domain: 'example.com', overallScore: 30, maxScore: 30, status: 'PASS', criteria: {}, alerts: [] }
        : url.includes('/headers/')
          ? { domain: 'example.com', overallScore: 10, maxScore: 10, status: 'PASS', criteria: {}, observatory: {}, alerts: [] }
          : url.includes('/email/')
            ? { domain: 'example.com', hasMailService: true, moduleApplicable: true, overallScore: 20, maxScore: 20, status: 'PASS', criteria: {}, dnsSummary: {}, alerts: [] }
            : { domain: 'example.com', overallScore: 20, maxScore: 20, status: 'PASS', criteria: {}, summary: {}, alerts: [] }

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const bundlePromise = fetchAssessmentDashboardBundle('example.com')
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(5)

    resolveAssessment(new Response(JSON.stringify({
      domain: 'example.com',
      overallScore: 90,
      status: 'PASS',
      grade: 'A',
      maxScore: 100,
      emailModuleIncluded: true,
      pqcReadiness: { status: 'INFO' },
      weights: {},
      modules: {},
      alerts: [],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(bundlePromise).resolves.toMatchObject({
      assessment: { domain: 'example.com' },
      ssl: { domain: 'example.com' },
    })
  })

  it('returns backend text when a request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response('Backend unavailable', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }),
    ))

    await expect(fetchAssessmentCheck('example.com')).rejects.toThrow('Backend unavailable')
  })

  it('encodes nested ssl detail route targets with normalized domains', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      new Response(JSON.stringify({ domain: 'portal.example.com', dataSource: 'DIRECT_TLS', alerts: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    await fetchSslDetails('https://portal.example.com/login')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/ssl/details/portal.example.com')
  })
})
