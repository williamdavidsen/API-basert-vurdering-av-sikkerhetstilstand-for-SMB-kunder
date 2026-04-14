import DownloadRounded from '@mui/icons-material/DownloadRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { isDashboardModuleKey } from '../features/assessment/model/assessment.constants'
import type {
  DashboardModuleKey,
  EmailCheckResult,
  HeadersCheckResult,
  ReputationCheckResult,
  SslCheckResult,
  SslDetailResult,
} from '../features/assessment/model/assessment.types'
import {
  fetchEmailCheck,
  fetchHeadersCheck,
  fetchSslDetails,
  fetchReputationCheck,
  fetchSslCheck,
} from '../features/assessment/services/assessment.api'
import { routes } from '../shared/constants/routes'
import { gradeFromPercent, modulePercent } from '../shared/lib/score'

type ModulePayload = SslCheckResult | HeadersCheckResult | EmailCheckResult | ReputationCheckResult

type LoadedData = {
  moduleKey: DashboardModuleKey
  modulePayload: ModulePayload
  sslDetails?: SslDetailResult
  loadedAtIso: string
}

type AsyncState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: LoadedData }

type Narrative = {
  moduleTitle: string
  score: number
  maxScore: number
  moduleGrade: string
  status: string
  summary: string[]
  recommendation: string
  checklist: string[]
  evidence: string[]
}

const moduleTabs: Array<{ key: DashboardModuleKey; label: string }> = [
  { key: 'ssl-tls', label: 'TLS / SSL' },
  { key: 'http-headers', label: 'HTTP Headers' },
  { key: 'email', label: 'E-mail' },
  { key: 'reputation', label: 'Domain / IP reputation' },
]

export function ModuleDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const printableRef = useRef<HTMLDivElement | null>(null)

  const domain = useMemo(() => {
    const raw = params.domain ?? ''
    try {
      return decodeURIComponent(raw).trim()
    } catch {
      return raw.trim()
    }
  }, [params.domain])

  const moduleKey = params.module ?? ''
  const invalidModule = moduleKey.length > 0 && !isDashboardModuleKey(moduleKey)

  const [state, setState] = useState<AsyncState>({ status: 'idle' })
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  useEffect(() => {
    if (invalidModule || !domain) {
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading' })

    void (async () => {
      try {
        const modulePayload =
          moduleKey === 'ssl-tls'
            ? await fetchSslCheck(domain, controller.signal)
            : moduleKey === 'http-headers'
              ? await fetchHeadersCheck(domain, controller.signal)
              : moduleKey === 'email'
                ? await fetchEmailCheck(domain, controller.signal)
                : await fetchReputationCheck(domain, controller.signal)

        if (controller.signal.aborted) return
        setState({
          status: 'success',
          data: {
            moduleKey: moduleKey as DashboardModuleKey,
            modulePayload,
            loadedAtIso: new Date().toISOString(),
          },
        })

        // SSL details can be slower; load them in background after first render.
        if (moduleKey === 'ssl-tls') {
          void fetchSslDetails(domain, controller.signal)
            .then((sslDetails) => {
              if (controller.signal.aborted) return
              setState((prev) =>
                prev.status === 'success' && prev.data.moduleKey === 'ssl-tls'
                  ? {
                      status: 'success',
                      data: {
                        ...prev.data,
                        sslDetails,
                      },
                    }
                  : prev,
              )
            })
            .catch(() => {
              // Keep the page usable even if extended SSL detail data is unavailable.
            })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Could not load module details.'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [domain, invalidModule, moduleKey])

  const backToDashboard = () => {
    const query = new URLSearchParams({ domain })
    navigate(`${routes.dashboard}?${query.toString()}`)
  }

  async function handleDownloadPdf() {
    if (!printableRef.current || state.status !== 'success') return

    setIsDownloadingPdf(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const imageHeight = (canvas.height * contentWidth) / canvas.width

      let remainingHeight = imageHeight
      let yOffset = 0
      pdf.addImage(imageData, 'PNG', margin, margin, contentWidth, imageHeight)
      remainingHeight -= pageHeight - margin * 2

      while (remainingHeight > 0) {
        yOffset += pageHeight - margin * 2
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', margin, margin - yOffset, contentWidth, imageHeight)
        remainingHeight -= pageHeight - margin * 2
      }

      const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '_')
      pdf.save(`read-more-${moduleKey}-${safeDomain}.pdf`)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  if (invalidModule) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="warning">This module page does not exist.</Alert>
        <Button sx={{ mt: 2 }} variant="contained" color="secondary" onClick={() => navigate(routes.home)}>
          Go to home
        </Button>
      </Box>
    )
  }

  if (!domain) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="info">Missing domain in the URL.</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" color="secondary" onClick={() => navigate(routes.home)}>
          Go to home
        </Button>
      </Box>
    )
  }

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-live="polite">
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress aria-label="Loading module details" />
          <Typography color="text.secondary">Loading module details…</Typography>
        </Stack>
      </Box>
    )
  }

  if (state.status === 'error') {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Alert severity="error">{state.message}</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" color="secondary" onClick={backToDashboard}>
          Back to dashboard
        </Button>
      </Box>
    )
  }

  if (state.status !== 'success') {
    return null
  }

  const safeModuleKey = moduleKey as DashboardModuleKey
  if (state.data.moduleKey !== safeModuleKey) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-live="polite">
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress aria-label="Switching module details" />
          <Typography color="text.secondary">Switching module details…</Typography>
        </Stack>
      </Box>
    )
  }

  const narrative = buildNarrative(safeModuleKey, state.data.modulePayload, state.data.sslDetails)
  const encodedDomain = encodeURIComponent(domain)

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}>
          <Button variant="text" color="secondary" onClick={backToDashboard} sx={{ alignSelf: 'flex-start', fontWeight: 800 }}>
            ← Back to results
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadRounded />}
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            sx={{ fontWeight: 700 }}
          >
            {isDownloadingPdf ? 'Preparing PDF…' : 'Download report (PDF)'}
          </Button>
        </Stack>

        <Stack spacing={0.5}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 0.5,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: alpha('#00acc1', 0.35), borderRadius: 999 },
            }}
          >
            {moduleTabs.map((tab) => {
              const isActive = tab.key === safeModuleKey
              return (
                <Button
                  key={tab.key}
                  component={RouterLink}
                  to={`${routes.dashboard}/${encodedDomain}/${tab.key}`}
                  variant={isActive ? 'contained' : 'outlined'}
                  color="secondary"
                  sx={{
                    flexShrink: 0,
                    borderRadius: 999,
                    px: 2,
                    py: 0.75,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 6px 18px rgba(0, 172, 193, 0.28)' : 'none',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </Button>
              )
            })}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 0.5 }}>
            You can view other module analyses from these tabs.
          </Typography>
        </Stack>

        <Stack ref={printableRef} spacing={2.5}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              borderColor: alpha('#00acc1', 0.25),
              background: 'linear-gradient(180deg, #f7fdff 0%, #ffffff 100%)',
            }}
          >
            <Stack spacing={1.5}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: 'secondary.dark' }}>
                {narrative.moduleTitle}
              </Typography>
              <Typography variant="overline" sx={{ color: 'secondary.dark', fontWeight: 800 }}>
                Target domain
              </Typography>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {domain}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {narrative.moduleTitle} deep dive
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • scanned {formatDateTime(state.data.loadedAtIso)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip label={`Score ${narrative.score}/${narrative.maxScore}`} color={statusToChipColor(narrative.status)} />
                <Chip label={`Grade ${narrative.moduleGrade}`} variant="outlined" color="secondary" />
                <Chip label={narrative.status} variant="outlined" color={statusToChipColor(narrative.status)} />
              </Stack>
            </Stack>
          </Paper>

          <SectionCard title="Summary">
            <BulletList items={narrative.summary} />
          </SectionCard>

          <SectionCard title="Recommendation from scan">
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
              {narrative.recommendation}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              This recommendation reflects the latest module data and is prioritized for practical impact.
            </Typography>
          </SectionCard>

          <SectionCard title="Hardening checklist">
            <BulletList items={narrative.checklist} />
          </SectionCard>

          <SectionCard title="Evidence from endpoint data">
            <BulletList items={narrative.evidence} />
          </SectionCard>
        </Stack>
      </Stack>
    </Box>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 900, color: 'secondary.dark', mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <Stack component="ul" spacing={0.9} sx={{ m: 0, pl: 2.3 }}>
      {items.map((item) => (
        <Typography component="li" key={item} variant="body1" sx={{ lineHeight: 1.55 }}>
          {item}
        </Typography>
      ))}
    </Stack>
  )
}

function statusToChipColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  const key = status.trim().toUpperCase()
  if (key === 'PASS') return 'success'
  if (key === 'WARNING') return 'warning'
  if (key === 'ERROR') return 'error'
  if (key === 'FAIL') return 'error'
  return 'default'
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function buildNarrative(moduleKey: DashboardModuleKey, payload: ModulePayload, sslDetails?: SslDetailResult): Narrative {
  if (moduleKey === 'ssl-tls') {
    const data = payload as SslCheckResult
    const daysRemaining = sslDetails?.certificate?.daysRemaining
    const endpointSummary =
      sslDetails?.endpoints?.slice(0, 2).map((endpoint) => `${endpoint.serverName || endpoint.ipAddress}: grade ${endpoint.grade}`).join('; ') ||
      'No endpoint-grade breakdown was returned from SSL details.'

    return {
      moduleTitle: 'TLS / SSL analysis',
      score: data.overallScore,
      maxScore: data.maxScore,
      moduleGrade: gradeFromPercent(modulePercent(data.overallScore, data.maxScore)),
      status: data.status,
      summary: [
        data.criteria.tlsVersion.details || 'TLS protocol posture was measured from available handshake data.',
        data.criteria.certificateValidity.details || 'Certificate validity checks completed without a detailed note.',
        daysRemaining != null
          ? `Certificate has approximately ${daysRemaining} day(s) remaining before expiry.`
          : data.criteria.remainingLifetime.details || 'Certificate remaining lifetime is available in endpoint evidence.',
      ],
      recommendation:
        data.alerts.find((alert) => alert.type.toUpperCase().includes('CRITICAL'))?.message ||
        data.alerts[0]?.message ||
        'Prioritize certificate lifecycle monitoring, then tighten legacy TLS and weaker cipher options.',
      checklist: [
        'Enable certificate expiry monitoring and route alerts to your operations channel.',
        'Keep TLS 1.2+ only in production; retire older protocols and weak ciphers.',
        'Use automated renewal (ACME or enterprise CA workflow) to reduce outage risk.',
      ],
      evidence: [
        `Module status: ${data.status} (${data.overallScore}/${data.maxScore}).`,
        `TLS detail: ${data.criteria.tlsVersion.details || 'Not specified'}.`,
        `Certificate detail: ${data.criteria.certificateValidity.details || 'Not specified'}.`,
        `Endpoint notes: ${endpointSummary}`,
      ],
    }
  }

  if (moduleKey === 'http-headers') {
    const data = payload as HeadersCheckResult
    const missingBits: string[] = []
    if (data.criteria.strictTransportSecurity.score <= 0) missingBits.push('HSTS')
    if (data.criteria.contentSecurityPolicy.score <= 0) missingBits.push('CSP')
    if (data.criteria.clickjackingProtection.score <= 0) missingBits.push('clickjacking protection')
    if (data.criteria.mimeSniffingProtection.score <= 0) missingBits.push('MIME sniffing protection')
    if (data.criteria.referrerPolicy.score <= 0) missingBits.push('referrer policy')

    return {
      moduleTitle: 'HTTP headers analysis',
      score: data.overallScore,
      maxScore: data.maxScore,
      moduleGrade: data.observatory.grade && data.observatory.grade !== 'UNAVAILABLE'
        ? data.observatory.grade
        : gradeFromPercent(modulePercent(data.overallScore, data.maxScore)),
      status: data.status,
      summary: [
        data.criteria.strictTransportSecurity.details,
        data.criteria.contentSecurityPolicy.details,
        missingBits.length > 0
          ? `Missing or weak controls detected: ${missingBits.join(', ')}.`
          : 'Core browser-facing security headers were detected.',
      ],
      recommendation:
        data.alerts.find((alert) => alert.type.toUpperCase().includes('CRITICAL'))?.message ||
        data.alerts[0]?.message ||
        'Roll out missing headers in staged environments and validate with browser compatibility tests.',
      checklist: [
        'Set HSTS with a safe max-age and includeSubDomains after validation.',
        'Adopt CSP with strict defaults and remove unsafe-inline / unsafe-eval where possible.',
        'Add X-Content-Type-Options and a strict Referrer-Policy baseline.',
      ],
      evidence: [
        `Observatory grade: ${data.observatory.grade || 'N/A'} (${data.observatory.score}/100).`,
        `Tests passed: ${data.observatory.testsPassed}/${data.observatory.testsQuantity}.`,
        `Module status: ${data.status} (${data.overallScore}/${data.maxScore}).`,
        data.observatory.detailsUrl ? `Reference URL: ${data.observatory.detailsUrl}` : 'No external details URL provided.',
      ],
    }
  }

  if (moduleKey === 'email') {
    const data = payload as EmailCheckResult
    const moduleScored = data.moduleApplicable
    return {
      moduleTitle: 'E-mail security analysis',
      score: data.overallScore,
      maxScore: data.maxScore,
      moduleGrade: moduleScored ? gradeFromPercent(modulePercent(data.overallScore, data.maxScore)) : '—',
      status: data.status,
      summary: [
        data.criteria.spfVerification.details,
        data.criteria.dkimActivated.details,
        data.criteria.dmarcEnforcement.details,
      ],
      recommendation:
        data.alerts.find((alert) => alert.type.toUpperCase().includes('CRITICAL'))?.message ||
        data.alerts[0]?.message ||
        (moduleScored
          ? 'Strengthen SPF, DKIM, and DMARC together to reduce spoofing and phishing risk.'
          : 'No active mail profile found on this domain; validate mail setup before enabling policy enforcement.'),
      checklist: [
        'Publish SPF with explicit sender sources and an enforcement policy.',
        'Enable DKIM signing for all outbound mail flows and rotate keys periodically.',
        'Use DMARC with quarantine/reject and monitor aggregate reports.',
      ],
      evidence: [
        `Module applicable: ${data.moduleApplicable ? 'yes' : 'no'}.`,
        `MX records: ${data.dnsSummary.mxRecords.length > 0 ? data.dnsSummary.mxRecords.join(', ') : 'none found'}.`,
        `SPF: ${data.dnsSummary.spfRecord || 'not found'}.`,
        `DMARC: ${data.dnsSummary.dmarcRecord || 'not found'}.`,
      ],
    }
  }

  const data = payload as ReputationCheckResult
  return {
    moduleTitle: 'Reputation analysis',
    score: data.overallScore,
    maxScore: data.maxScore,
    moduleGrade: gradeFromPercent(modulePercent(data.overallScore, data.maxScore)),
    status: data.status,
    summary: [
      data.criteria.blacklistStatus.details,
      data.criteria.malwareAssociation.details,
      `Detection profile: malicious ${data.summary.maliciousDetections}, suspicious ${data.summary.suspiciousDetections}, harmless ${data.summary.harmlessDetections}.`,
    ],
    recommendation:
      data.alerts.find((alert) => alert.type.toUpperCase().includes('CRITICAL'))?.message ||
      data.alerts[0]?.message ||
      'Continue monitoring reputation changes and investigate sudden spikes in suspicious detections.',
    checklist: [
      'Track malicious/suspicious detection deltas over time, not only point-in-time values.',
      'Correlate reputation shifts with hosting, DNS, and certificate changes.',
      'Create an incident response playbook for domain reputation degradation.',
    ],
    evidence: [
      `Reputation score: ${data.summary.reputation}.`,
      `Community votes: malicious ${data.summary.communityMaliciousVotes}, harmless ${data.summary.communityHarmlessVotes}.`,
      `Last analysis date: ${data.summary.lastAnalysisDate || 'not provided'}.`,
      data.summary.permalink ? `Source permalink: ${data.summary.permalink}` : 'No source permalink provided.',
    ],
  }
}
