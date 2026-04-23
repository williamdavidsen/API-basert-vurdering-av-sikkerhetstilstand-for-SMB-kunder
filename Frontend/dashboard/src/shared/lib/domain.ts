const domainPattern = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i

function trimDecorators(value: string): string {
  return value
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\/+$/g, '')
    .replace(/\.+$/g, '')
}

export function normalizeDomainInput(value: string): string {
  const trimmed = trimDecorators(value).toLowerCase()
  if (!trimmed) return ''

  const withScheme =
    trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    return trimDecorators(parsed.hostname)
  } catch {
    const withoutScheme = trimmed.replace(/^https?:\/\//i, '')
    const withoutPath = withoutScheme.split(/[/?#]/, 1)[0] ?? ''
    const withoutCredentials = withoutPath.split('@').pop() ?? ''
    const withoutPort = withoutCredentials.replace(/:\d+$/, '')
    return trimDecorators(withoutPort)
  }
}

export function isValidDomain(value: string): boolean {
  return domainPattern.test(normalizeDomainInput(value))
}
