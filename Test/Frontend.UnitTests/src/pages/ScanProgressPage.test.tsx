import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanProgressPage } from '../../../../Frontend/dashboard/src/pages/ScanProgressPage'

const mockNavigate = vi.fn()
const mockSaveLastScannedDomain = vi.fn()
const mockUseScanProgress = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../../Frontend/dashboard/src/shared/lib/lastScan', () => ({
  saveLastScannedDomain: (domain: string) => mockSaveLastScannedDomain(domain),
}))

vi.mock('../../../../Frontend/dashboard/src/features/scan/hooks/useScanProgress', () => ({
  useScanProgress: () => mockUseScanProgress(),
}))

describe('ScanProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('redirects home when the URL does not contain a domain', () => {
    mockUseScanProgress.mockReturnValue({
      progress: 2,
      currentStep: 'Checking TLS',
      estimatedLabel: 'Estimated time remaining: about 10 seconds.',
      isComplete: false,
    })

    renderWithRoute('/scan')

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('shows progress text from the scan hook', () => {
    mockUseScanProgress.mockReturnValue({
      progress: 40,
      currentStep: 'Reviewing domain reputation signals',
      estimatedLabel: 'Estimated time remaining: about 6 seconds.',
      isComplete: false,
    })

    renderWithRoute('/scan?domain=example.com')

    expect(screen.getByText('Domain Security Assessment in Progress')).toBeInTheDocument()
    expect(screen.getByText('Reviewing domain reputation signals...')).toBeInTheDocument()
    expect(screen.getByText('Estimated time remaining: about 6 seconds.')).toBeInTheDocument()
  })

  it('saves the domain and redirects to the dashboard after completion', () => {
    mockUseScanProgress.mockReturnValue({
      progress: 100,
      currentStep: 'Complete',
      estimatedLabel: 'Scan is complete. Redirecting to dashboard...',
      isComplete: true,
    })

    renderWithRoute('/scan?domain=https://example.com/path')

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(mockSaveLastScannedDomain).toHaveBeenCalledWith('example.com')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?domain=example.com')
  })
})

function renderWithRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/scan" element={<ScanProgressPage />} />
      </Routes>
    </MemoryRouter>,
  )
}
