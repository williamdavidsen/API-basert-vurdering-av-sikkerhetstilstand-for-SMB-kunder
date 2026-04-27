import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DomainScanForm } from '../../../../Frontend/dashboard/src/features/home/components/DomainScanForm'

describe('DomainScanForm', () => {
  it('shows a required error when the field is empty', () => {
    const onSubmitDomain = vi.fn()

    render(<DomainScanForm onSubmitDomain={onSubmitDomain} />)

    fireEvent.click(screen.getByRole('button', { name: /run security scan/i }))

    expect(screen.getAllByText('Domain is required.')).toHaveLength(2)
    expect(onSubmitDomain).not.toHaveBeenCalled()
  })

  it('blocks malformed domains and keeps the user on the form', () => {
    const onSubmitDomain = vi.fn()

    render(<DomainScanForm onSubmitDomain={onSubmitDomain} />)

    fireEvent.change(screen.getByLabelText(/enter domain name/i), {
      target: { value: 'example..com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run security scan/i }))

    expect(screen.getAllByText('Please enter a valid domain like example.com')).toHaveLength(2)
    expect(onSubmitDomain).not.toHaveBeenCalled()
  })

  it('normalizes a full url before submitting the scan', () => {
    const onSubmitDomain = vi.fn()

    render(<DomainScanForm onSubmitDomain={onSubmitDomain} />)

    fireEvent.change(screen.getByLabelText(/enter domain name/i), {
      target: { value: 'https://example.com/path' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run security scan/i }))

    expect(onSubmitDomain).toHaveBeenCalledWith('example.com')
    expect(screen.queryByText('Please enter a valid domain like example.com')).not.toBeInTheDocument()
  })

  it('rejects e-mail addresses as scan targets', () => {
    const onSubmitDomain = vi.fn()

    render(<DomainScanForm onSubmitDomain={onSubmitDomain} />)

    fireEvent.change(screen.getByLabelText(/enter domain name/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run security scan/i }))

    expect(screen.getAllByText('Please enter a valid domain like example.com')).toHaveLength(2)
    expect(onSubmitDomain).not.toHaveBeenCalled()
  })
})
