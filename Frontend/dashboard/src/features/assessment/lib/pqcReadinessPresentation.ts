import type { PqcCheckResult } from '../model/assessment.types'

export type PqcReadinessTone = 'success' | 'warning' | 'info'

export function getPqcReadinessTone(pqc: PqcCheckResult): PqcReadinessTone {
  if (pqc.pqcDetected) return 'success'

  const readiness = pqc.readinessLevel.trim().toLowerCase()
  const status = pqc.status.trim().toLowerCase()

  if (readiness.includes('hybrid pqc')) return 'success'

  if (readiness.includes('unavailable') || status === 'unavailable') return 'info'

  if (
    readiness.includes('not supported') ||
    readiness.includes('unknown') ||
    readiness.includes('not verifiable') ||
    status === 'unknown'
  ) {
    return 'warning'
  }

  return 'warning'
}

export function pqcReadinessTextColor(tone: PqcReadinessTone): 'success.dark' | 'warning.dark' | 'info.dark' {
  if (tone === 'success') return 'success.dark'
  if (tone === 'info') return 'info.dark'
  return 'warning.dark'
}

export function pqcReadinessChipColor(tone: PqcReadinessTone): 'success' | 'warning' | 'info' {
  return tone
}
