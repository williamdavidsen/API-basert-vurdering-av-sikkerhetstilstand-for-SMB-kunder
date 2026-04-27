import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from '../../../../Frontend/dashboard/src/pages/HomePage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../../Frontend/dashboard/src/features/home/components/HomeCarousel', () => ({
  HomeCarousel: () => <div>Mock Home Carousel</div>,
}))

describe('HomePage container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the carousel and routes a valid submission to the scan page', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Mock Home Carousel')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/enter domain name/i), {
      target: { value: 'https://example.com/login' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run security scan/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/scan?domain=example.com')
  })
})
