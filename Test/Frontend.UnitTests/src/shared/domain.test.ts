import { describe, expect, it } from 'vitest'
import { isValidDomain, normalizeDomainInput } from '../../../../Frontend/dashboard/src/shared/lib/domain'

describe('domain utilities', () => {
  it('normalizes urls and email-like values to a host name', () => {
    expect(normalizeDomainInput('https://portal.example.com/path')).toBe('portal.example.com')
    expect(normalizeDomainInput('security@contoso.example')).toBe('contoso.example')
    expect(normalizeDomainInput('http://example.com/')).toBe('example.com')
  })

  it('accepts valid domains after normalization and rejects invalid inputs', () => {
    expect(isValidDomain('https://example.com')).toBe(true)
    expect(isValidDomain('student.oslomet.no')).toBe(true)
    expect(isValidDomain('user@example.com')).toBe(false)
    expect(isValidDomain('example..com')).toBe(false)
    expect(isValidDomain('example!.com')).toBe(false)
  })
})
