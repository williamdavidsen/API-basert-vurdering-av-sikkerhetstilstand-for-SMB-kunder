import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModuleDetailPage } from '../../../../Frontend/dashboard/src/pages/ModuleDetailPage'
import type { EmailCheckResult, SslCheckResult, SslDetailResult } from '../../../../Frontend/dashboard/src/features/assessment/model/assessment.types'

const fetchSslCheck = vi.fn()
const fetchSslDetails = vi.fn()
const fetchHeadersCheck = vi.fn()
const fetchEmailCheck = vi.fn()
const fetchReputationCheck = vi.fn()

vi.mock('../../../../Frontend/dashboard/src/features/assessment/services/assessment.api', () => ({
  fetchSslCheck: (...args: unknown[]) => fetchSslCheck(...args),
  fetchSslDetails: (...args: unknown[]) => fetchSslDetails(...args),
  fetchHeadersCheck: (...args: unknown[]) => fetchHeadersCheck(...args),
  fetchEmailCheck: (...args: unknown[]) => fetchEmailCheck(...args),
  fetchReputationCheck: (...args: unknown[]) => fetchReputationCheck(...args),
}))

describe('ModuleDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a warning for invalid module routes', () => {
    renderWithModuleRoute('/dashboard/example.com/not-a-module')

    expect(screen.getByText('This module page does not exist.')).toBeInTheDocument()
  })

  it('shows an info state when the URL is missing the domain parameter', () => {
    renderWithRoute('/dashboard/:module', '/dashboard/email')

    expect(screen.getByText('Missing domain in the URL.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument()
  })

  it('shows an error state when module data loading fails', async () => {
    fetchEmailCheck.mockRejectedValue(new Error('Could not load email details.'))

    renderWithModuleRoute('/dashboard/example.com/email')

    expect(await screen.findByText('Could not load email details.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument()
  })

  it('renders the e-mail error narrative when DNS-based checks fail', async () => {
    fetchEmailCheck.mockResolvedValue(createEmailErrorResult())

    renderWithModuleRoute('/dashboard/example.com/email')

    await waitFor(() => {
      expect(fetchEmailCheck).toHaveBeenCalled()
    })

    expect(await screen.findByText('E-mail security analysis')).toBeInTheDocument()
    expect(screen.getByText(/dns-based e-mail security checks could not be completed reliably/i)).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('renders SSL details and background evidence when the detail endpoint succeeds', async () => {
    fetchSslCheck.mockResolvedValue(createSslResult())
    fetchSslDetails.mockResolvedValue(createSslDetailResult())

    renderWithModuleRoute('/dashboard/example.com/ssl-tls')

    expect(await screen.findByText('TLS / SSL analysis')).toBeInTheDocument()
    expect(screen.getByText('Domain overview')).toBeInTheDocument()
    expect(screen.getByText('TLS-versjon')).toBeInTheDocument()
    expect(screen.getByText('Sertifikatgyldighet')).toBeInTheDocument()
    expect(screen.getByText('Krypteringsstyrke (Cipher Strength)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchSslDetails).toHaveBeenCalledWith('example.com', expect.any(AbortSignal))
    })

    expect(screen.getByText('TLS 1.3')).toBeInTheDocument()
    expect(screen.getByText('Certificate valid until')).toBeInTheDocument()
    expect(screen.getAllByText(/ecdsa-with-sha256/i).length).toBeGreaterThanOrEqual(1)
  })

  it('exports the rendered report to PDF from the download button', async () => {
    fetchSslCheck.mockResolvedValue(createSslResult())
    fetchSslDetails.mockResolvedValue(createSslDetailResult())

    renderWithModuleRoute('/dashboard/example.com/ssl-tls')

    const button = await screen.findByRole('button', { name: /download report/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preparing pdf/i })).toBeDisabled()
    })
  })
})

function renderWithModuleRoute(initialEntry: string) {
  return renderWithRoute('/dashboard/:domain/:module', initialEntry)
}

function renderWithRoute(path: string, initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={path} element={<ModuleDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function createEmailErrorResult(): EmailCheckResult {
  return {
    domain: 'example.com',
    hasMailService: false,
    moduleApplicable: true,
    overallScore: 0,
    maxScore: 20,
    status: 'ERROR',
    criteria: {
      spfVerification: { score: 0, confidence: 'HIGH', details: '' },
      dkimActivated: { score: 0, confidence: 'HIGH', details: '' },
      dmarcEnforcement: { score: 0, confidence: 'HIGH', details: '' },
    },
    dnsSummary: {
      mxRecords: [],
      spfRecord: '',
      dmarcRecord: '',
      dkimSelectorsFound: [],
    },
    alerts: [
      {
        type: 'WARNING',
        message: 'Email security DNS lookups could not be completed reliably. MX lookup could not be completed.',
      },
    ],
  }
}

function createSslResult(): SslCheckResult {
  return {
    domain: 'example.com',
    overallScore: 24,
    maxScore: 30,
    status: 'WARNING',
    criteria: {
      tlsVersion: { score: 7, details: 'TLS 1.2 and TLS 1.3 supported' },
      certificateValidity: { score: 8, details: 'Certificate is currently valid.' },
      remainingLifetime: { score: 5, details: '90 days remaining' },
      cipherStrength: { score: 4, details: 'TLS_AES_256_GCM_SHA384 (256 bits)' },
    },
    alerts: [{ type: 'WARNING', message: 'Review older TLS compatibility settings.' }],
  }
}

function createSslDetailResult(): SslDetailResult {
  return {
    ...createSslResult(),
    dataSource: 'SSL Labs',
    dataSourceStatus: 'OK',
    endpoints: [
      {
        ipAddress: '203.0.113.10',
        serverName: 'example.com',
        grade: 'A',
      },
    ],
    certificate: {
      subject: 'CN=example.com, O=Example Org',
      issuer: 'CN=Example Issuing CA',
      fingerprintSha256: 'ABC123',
      signatureAlgorithm: 'ecdsa-with-SHA256',
      key: 'ECDSA P-256',
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2026-06-01T00:00:00Z',
      daysRemaining: 90,
      commonNames: ['example.com'],
      altNames: ['www.example.com'],
    },
    supportedTlsVersions: ['TLS 1.3', 'TLS 1.2'],
    notableCipherSuites: ['TLS_AES_256_GCM_SHA384 (256 bits)'],
  }
}
