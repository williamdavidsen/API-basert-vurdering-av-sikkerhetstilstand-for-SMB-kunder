import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PqcInsightModal } from '../../../../Frontend/dashboard/src/features/assessment/components/PqcInsightModal'

describe('PqcInsightModal', () => {
  it('renders the fallback note when no evidence is available', () => {
    const onClose = vi.fn()

    render(
      <PqcInsightModal
        open
        onClose={onClose}
        autoCloseSeconds={7}
        pqc={{
          domain: 'example.com',
          pqcDetected: false,
          status: 'INFO',
          mode: 'Classical TLS',
          readinessLevel: 'Unknown / not verifiable',
          algorithmFamily: 'Classical TLS',
          handshakeSupported: true,
          confidence: 'LOW',
          notes: '',
          evidence: [],
        }}
      />,
    )

    expect(screen.getByText(/this window closes automatically after about 7 seconds/i)).toBeInTheDocument()
    expect(screen.getByText('Unknown / not verifiable')).toBeInTheDocument()
    expect(screen.getByText('No additional notes were returned for this domain.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders up to six evidence items and closes from both controls', () => {
    const onClose = vi.fn()

    render(
      <PqcInsightModal
        open
        onClose={onClose}
        pqc={{
          domain: 'example.com',
          pqcDetected: true,
          status: 'INFO',
          mode: 'Hybrid',
          readinessLevel: 'Observed',
          algorithmFamily: 'Hybrid',
          handshakeSupported: true,
          confidence: 'MEDIUM',
          notes: 'Signals were detected.',
          evidence: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
        }}
      />,
    )

    expect(screen.getByText('Signals were detected.')).toBeInTheDocument()
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('six')).toBeInTheDocument()
    expect(screen.queryByText('seven')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close post-quantum dialog/i }))
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
