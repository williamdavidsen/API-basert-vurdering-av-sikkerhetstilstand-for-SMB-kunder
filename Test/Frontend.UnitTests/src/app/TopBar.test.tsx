import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TopBar } from '../../../../Frontend/dashboard/src/app/layout/TopBar'

describe('TopBar', () => {
  it('renders top-level navigation links for the current route', () => {
    renderWithRoute('/dashboard')

    expect(screen.getByLabelText('Top navigation - Security dashboard')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Threat Landscape' })).toHaveAttribute(
      'href',
      '/threat-landscape/phishing-spoofing',
    )
  })

  it('opens the mobile drawer and lets the user expand the threat submenu', () => {
    renderWithRoute('/')

    fireEvent.click(screen.getByRole('button', { name: /open mobile navigation menu/i }))

    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.queryByText('Phishing & spoofing')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Threat Landscape' }))

    expect(screen.getByText('Phishing & spoofing')).toBeInTheDocument()
    expect(screen.getByText('Weak TLS / certs')).toBeInTheDocument()
    expect(screen.getByText('Missing headers')).toBeInTheDocument()
  })

  it('keeps the threat submenu open when the current route is already a threat page', () => {
    renderWithRoute('/threat-landscape/missing-headers')

    fireEvent.click(screen.getByRole('button', { name: /open mobile navigation menu/i }))

    expect(screen.getByText('Phishing & spoofing')).toBeInTheDocument()
    expect(screen.getByText('Weak TLS / certs')).toBeInTheDocument()
    expect(screen.getByText('Missing headers')).toBeInTheDocument()
  })
})

function renderWithRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TopBar title={route === '/' ? 'Home page' : route.includes('threat-landscape') ? 'Threat landscape' : 'Security dashboard'} />
    </MemoryRouter>,
  )
}
