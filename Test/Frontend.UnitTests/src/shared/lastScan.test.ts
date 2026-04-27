import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLastScannedDomain, saveLastScannedDomain } from '../../../../Frontend/dashboard/src/shared/lib/lastScan'

describe('lastScan storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('saves a normalized domain and reads it back', () => {
    saveLastScannedDomain('https://example.com/path')

    expect(window.localStorage.getItem('smb.lastScannedDomain')).toBe('example.com')
    expect(getLastScannedDomain()).toBe('example.com')
  })

  it('ignores empty values instead of storing them', () => {
    saveLastScannedDomain('   ')

    expect(window.localStorage.getItem('smb.lastScannedDomain')).toBeNull()
    expect(getLastScannedDomain()).toBeNull()
  })

  it('returns null when storage contains an empty saved value', () => {
    window.localStorage.setItem('smb.lastScannedDomain', '')

    expect(getLastScannedDomain()).toBeNull()
  })

  it('swallows storage write failures', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => saveLastScannedDomain('example.com')).not.toThrow()
    expect(setItemSpy).toHaveBeenCalled()
  })

  it('swallows storage read failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(getLastScannedDomain()).toBeNull()
  })
})
