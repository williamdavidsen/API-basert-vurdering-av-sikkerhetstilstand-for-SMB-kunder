import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAssessmentDashboard } from '../../../../Frontend/dashboard/src/features/assessment/hooks/useAssessmentDashboard'
import type { AssessmentDashboardBundle } from '../../../../Frontend/dashboard/src/features/assessment/model/assessment.types'

const fetchAssessmentDashboardBundle = vi.fn()

vi.mock('../../../../Frontend/dashboard/src/features/assessment/services/assessment.api', () => ({
  fetchAssessmentDashboardBundle: (...args: unknown[]) => fetchAssessmentDashboardBundle(...args),
}))

describe('useAssessmentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stays idle when the domain is empty after normalization', async () => {
    const { result } = renderHook(() => useAssessmentDashboard(''))

    await waitFor(() => {
      expect(result.current.state.status).toBe('idle')
    })

    expect(fetchAssessmentDashboardBundle).not.toHaveBeenCalled()
  })

  it('loads and stores a successful dashboard bundle', async () => {
    fetchAssessmentDashboardBundle.mockResolvedValue(createBundle())

    const { result } = renderHook(() => useAssessmentDashboard('https://example.com/path'))

    await waitFor(() => {
      expect(result.current.state.status).toBe('success')
    })

    expect(fetchAssessmentDashboardBundle).toHaveBeenCalledWith('example.com', expect.any(AbortSignal))
    if (result.current.state.status !== 'success') {
      throw new Error('Expected success state')
    }
    expect(result.current.state.data.assessment.domain).toBe('example.com')
    expect(result.current.state.scannedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('exposes backend error messages and retries on refetch', async () => {
    fetchAssessmentDashboardBundle
      .mockRejectedValueOnce(new Error('Dashboard failed.'))
      .mockResolvedValueOnce(createBundle())

    const { result } = renderHook(() => useAssessmentDashboard('example.com'))

    await waitFor(() => {
      expect(result.current.state.status).toBe('error')
    })

    expect(result.current.state).toEqual({ status: 'error', message: 'Dashboard failed.' })

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('success')
    })

    expect(fetchAssessmentDashboardBundle).toHaveBeenCalledTimes(2)
  })

  it('uses a fallback error message for non-Error failures', async () => {
    fetchAssessmentDashboardBundle.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useAssessmentDashboard('example.com'))

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'error',
        message: 'Could not load assessment.',
      })
    })
  })
})

function createBundle(): AssessmentDashboardBundle {
  return {
    assessment: {
      domain: 'example.com',
      overallScore: 80,
      maxScore: 100,
      status: 'PASS',
      grade: 'B',
      emailModuleIncluded: true,
      pqcReadiness: {
        domain: 'example.com',
        pqcDetected: false,
        status: 'INFO',
        mode: 'Classical TLS',
        readinessLevel: 'Unknown / not verifiable',
        algorithmFamily: 'Classical TLS',
        handshakeSupported: true,
        confidence: 'LOW',
        notes: 'No explicit PQC support was detected.',
        evidence: [],
      },
      weights: { sslTls: 30, httpHeaders: 25, emailSecurity: 20, reputation: 25 },
      modules: {
        sslTls: { included: true, weightPercent: 30, rawScore: 24, rawMaxScore: 30, normalizedScore: 80, weightedContribution: 24, status: 'PASS' },
        httpHeaders: { included: true, weightPercent: 25, rawScore: 9, rawMaxScore: 10, normalizedScore: 90, weightedContribution: 22.5, status: 'PASS' },
        emailSecurity: { included: true, weightPercent: 20, rawScore: 15, rawMaxScore: 20, normalizedScore: 75, weightedContribution: 15, status: 'WARNING' },
        reputation: { included: true, weightPercent: 25, rawScore: 15, rawMaxScore: 20, normalizedScore: 75, weightedContribution: 18.75, status: 'PASS' },
      },
      alerts: [],
    },
    ssl: {
      domain: 'example.com',
      overallScore: 24,
      maxScore: 30,
      status: 'PASS',
      criteria: {
        tlsVersion: { score: 8, details: 'TLS 1.3' },
        certificateValidity: { score: 8, details: 'Valid' },
        remainingLifetime: { score: 4, details: '90 days remaining' },
        cipherStrength: { score: 4, details: 'Modern cipher' },
      },
      alerts: [],
    },
    headers: {
      domain: 'example.com',
      overallScore: 9,
      maxScore: 10,
      status: 'PASS',
      criteria: {
        strictTransportSecurity: { score: 3, details: 'Present' },
        contentSecurityPolicy: { score: 3, details: 'Present' },
        clickjackingProtection: { score: 3, details: 'Present' },
        mimeSniffingProtection: { score: 0, details: 'nosniff' },
        referrerPolicy: { score: 0, details: 'strict-origin-when-cross-origin' },
      },
      observatory: { grade: 'A', score: 90, testsPassed: 9, testsFailed: 1, testsQuantity: 10, detailsUrl: '' },
      alerts: [],
    },
    email: {
      domain: 'example.com',
      hasMailService: true,
      moduleApplicable: true,
      overallScore: 15,
      maxScore: 20,
      status: 'WARNING',
      criteria: {
        spfVerification: { score: 5, confidence: 'HIGH', details: 'Present' },
        dkimActivated: { score: 5, confidence: 'HIGH', details: 'Present' },
        dmarcEnforcement: { score: 5, confidence: 'HIGH', details: 'Monitor mode' },
      },
      dnsSummary: {
        mxRecords: ['mx.example.com'],
        spfRecord: 'v=spf1 include:_spf.example.com ~all',
        dmarcRecord: 'v=DMARC1; p=none',
        dkimSelectorsFound: ['selector1'],
      },
      alerts: [],
    },
    reputation: {
      domain: 'example.com',
      overallScore: 15,
      maxScore: 20,
      status: 'PASS',
      criteria: {
        blacklistStatus: { score: 10, confidence: 'HIGH', details: 'No blacklist detections' },
        malwareAssociation: { score: 5, confidence: 'MEDIUM', details: 'No malware association' },
      },
      summary: {
        maliciousDetections: 0,
        suspiciousDetections: 0,
        harmlessDetections: 5,
        undetectedDetections: 50,
        reputation: 10,
        communityMaliciousVotes: 0,
        communityHarmlessVotes: 2,
        lastAnalysisDate: '',
        permalink: '',
      },
      alerts: [],
    },
  }
}
