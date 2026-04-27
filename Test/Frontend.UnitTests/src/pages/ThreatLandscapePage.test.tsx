import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThreatLandscapePage } from '../../../../Frontend/dashboard/src/pages/ThreatLandscapePage'

describe('ThreatLandscapePage', () => {
  it('renders the phishing topic and falls back to donut percentages for percent-based stats', () => {
    renderWithRoute('/threat-landscape/phishing-spoofing')

    expect(screen.getByText('Phishing & Spoofing')).toBeInTheDocument()
    expect(screen.getByAltText(/phishing illustration/i)).toBeInTheDocument()
    expect(screen.getAllByText('60%').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/ENISA Threat Landscape 2025/).length).toBeGreaterThanOrEqual(1)
  })

  it('falls back to the phishing topic when the route topic is unknown', () => {
    renderWithRoute('/threat-landscape/not-a-real-topic')

    expect(screen.getByText('Phishing & Spoofing')).toBeInTheDocument()
    expect(screen.getByText(/social engineering remains a leading entry point/i)).toBeInTheDocument()
  })

  it('renders the TLS topic with numeric and non-percent stat variants', () => {
    renderWithRoute('/threat-landscape/weak-tls-certs')

    expect(screen.getByText('Weak TLS / Certificates')).toBeInTheDocument()
    expect(screen.getByAltText(/tls security illustration/i)).toBeInTheDocument()
    expect(screen.getByText('21.3%')).toBeInTheDocument()
    expect(screen.getByText('32 days')).toBeInTheDocument()
  })

  it('renders the missing headers topic and uses the headers illustration branch', () => {
    renderWithRoute('/threat-landscape/missing-headers')

    expect(screen.getByText('Missing Security Headers')).toBeInTheDocument()
    expect(screen.getByAltText(/web security headers illustration/i)).toBeInTheDocument()
    expect(screen.getByText('Basic web application attacks')).toBeInTheDocument()
  })
})

function renderWithRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/threat-landscape/:topic" element={<ThreatLandscapePage />} />
      </Routes>
    </MemoryRouter>,
  )
}
