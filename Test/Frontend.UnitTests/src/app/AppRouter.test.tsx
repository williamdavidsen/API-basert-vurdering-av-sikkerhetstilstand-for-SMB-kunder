import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '../../../../Frontend/dashboard/src/app/router'

vi.mock('../../../../Frontend/dashboard/src/pages/HomePage', () => ({
  HomePage: () => <div>Mock Home Page</div>,
}))

vi.mock('../../../../Frontend/dashboard/src/pages/ScanProgressPage', () => ({
  ScanProgressPage: () => <div>Mock Scan Progress Page</div>,
}))

vi.mock('../../../../Frontend/dashboard/src/pages/SecurityDashboardPage', () => ({
  SecurityDashboardPage: () => <div>Mock Security Dashboard Page</div>,
}))

vi.mock('../../../../Frontend/dashboard/src/pages/ModuleDetailPage', () => ({
  ModuleDetailPage: () => <div>Mock Module Detail Page</div>,
}))

vi.mock('../../../../Frontend/dashboard/src/pages/ThreatLandscapePage', () => ({
  ThreatLandscapePage: () => <div>Mock Threat Landscape Page</div>,
}))

describe('AppRouter', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('renders the dashboard route inside the shared layout', () => {
    window.history.pushState({}, '', '/dashboard')

    render(<AppRouter />)

    expect(screen.getByText('Mock Security Dashboard Page')).toBeInTheDocument()
    expect(screen.getByLabelText('Top navigation - Security dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /threat landscape navigation/i })).not.toBeInTheDocument()
  })

  it('renders threat routes with the side navigation enabled', () => {
    window.history.pushState({}, '', '/threat-landscape/missing-headers')

    render(<AppRouter />)

    expect(screen.getByText('Mock Threat Landscape Page')).toBeInTheDocument()
    expect(screen.getByLabelText('Top navigation - Threat landscape')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /threat landscape navigation/i })).toBeInTheDocument()
  })

  it('redirects unknown routes back to the home page', () => {
    window.history.pushState({}, '', '/not-found')

    render(<AppRouter />)

    expect(screen.getByText('Mock Home Page')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })
})
