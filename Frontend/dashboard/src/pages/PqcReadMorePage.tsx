import DownloadRounded from '@mui/icons-material/DownloadRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PqcCheckResult } from '../features/assessment/model/assessment.types'
import { fetchAssessmentCheck } from '../features/assessment/services/assessment.api'
import { useNavigate, useParams } from 'react-router-dom'
import {
  pqcReadMoreDetectedMock,
  pqcReadMoreNotDetectedMock,
} from '../features/assessment/data/pqcReadMore.mock'
import { routes } from '../shared/constants/routes'
import { normalizeDomainInput } from '../shared/lib/domain'
import { getPqcReadinessTone, pqcReadinessChipColor } from '../features/assessment/lib/pqcReadinessPresentation'
import { ReadMoreModuleTabs } from '../features/module-detail/components/ReadMoreModuleTabs'
import { exportElementAsPdf } from '../features/module-detail/services/pdfExport'
import { BulletList, SectionCard } from '../shared/ui/ContentBlocks'

export function PqcReadMorePage() {
  const navigate = useNavigate()
  const params = useParams()
  const [pqcState, setPqcState] = useState<
    { status: 'idle' | 'loading' } | { status: 'ready'; pqc: PqcCheckResult } | { status: 'error'; message: string }
  >({ status: 'idle' })
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const printableRef = useRef<HTMLDivElement | null>(null)

  const domain = useMemo(() => {
    const raw = params.domain ?? ''
    try {
      return normalizeDomainInput(decodeURIComponent(raw))
    } catch {
      return normalizeDomainInput(raw)
    }
  }, [params.domain])

  useEffect(() => {
    if (!domain) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setPqcState({ status: 'loading' })

      try {
        const assessment = await fetchAssessmentCheck(domain, controller.signal)
        if (controller.signal.aborted) return
        setPqcState({ status: 'ready', pqc: assessment.pqcReadiness })
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Could not load PQC insight.'
        setPqcState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [domain])

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

  const readMoreContent =
    pqcState.status === 'ready' && pqcState.pqc.pqcDetected
      ? pqcReadMoreDetectedMock
      : pqcReadMoreNotDetectedMock
  const readyPqc = pqcState.status === 'ready' ? pqcState.pqc : null
  const readyPqcTone = readyPqc ? getPqcReadinessTone(readyPqc) : null
  const readyPqcChipColor = readyPqcTone ? pqcReadinessChipColor(readyPqcTone) : 'default'

  const backToDashboard = () => {
    navigate(`${routes.dashboard}?${new URLSearchParams({ domain }).toString()}`)
  }

  async function handleDownloadPdf() {
    if (!printableRef.current) return

    setIsDownloadingPdf(true)
    try {
      const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '_')
      await exportElementAsPdf(printableRef.current, `read-more-pqc-${safeDomain}.pdf`)
    } catch {
      // Keep the detail page usable even if client-side PDF export fails.
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}
        >
          <Button variant="text" color="secondary" onClick={backToDashboard} sx={{ alignSelf: 'flex-start', fontWeight: 800 }}>
            {'← Back to results'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadRounded />}
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            sx={{ fontWeight: 700 }}
          >
            {isDownloadingPdf ? 'Preparing PDF...' : 'Download report (PDF)'}
          </Button>
        </Stack>

        <ReadMoreModuleTabs domain={domain} activeTab="pqc" />

        <Stack ref={printableRef} spacing={2.5}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={1.25}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: 'secondary.dark' }}>
              Post-quantum readiness details
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Target domain: {domain}
            </Typography>
            {pqcState.status === 'loading' || pqcState.status === 'idle' ? (
              <Alert
                severity="info"
                icon={<CircularProgress size={16} aria-label="Loading PQC summary" />}
              >
                Loading PQC summary from the assessment API...
              </Alert>
            ) : pqcState.status === 'error' ? (
              <Alert severity="warning">
                Could not load live PQC summary from API. Showing curated read-more content.
              </Alert>
            ) : (
              <Alert severity="info">
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Status: <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>{readyPqc?.status}</Box>
                    </Typography>
                    <Chip size="small" label={readyPqc?.readinessLevel} color={readyPqcChipColor} variant="filled" />
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {readyPqc?.notes || 'No additional notes were returned for this domain.'}
                  </Typography>
                </Stack>
              </Alert>
            )}
          </Stack>
        </Paper>

        <SectionCard title={readMoreContent.overviewTitle}>
          <BulletList items={readMoreContent.overview} />
        </SectionCard>

        <SectionCard title={readMoreContent.sectionTwoTitle}>
          <BulletList items={readMoreContent.sectionTwo} />
        </SectionCard>

        <SectionCard title={readMoreContent.sectionThreeTitle}>
          <Stack spacing={1.1}>
            {readMoreContent.sectionThree.map((item) => (
              <Box key={item.title} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {item.summary}
                </Typography>
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title={readMoreContent.sectionFourTitle}>
          <BulletList items={readMoreContent.sectionFour} />
        </SectionCard>

        <Box
          sx={{
            px: { xs: 1.5, sm: 1.75 },
            py: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={0.75}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={0.75}
              sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: 13, lineHeight: 1.35 }}
              >
                Sources: NIST, NSM - NIST PQC program and NSM quantum migration guidance.
              </Typography>
              <Button
                variant="text"
                color="secondary"
                size="small"
                onClick={() => setSourcesOpen((prev) => !prev)}
                sx={{ p: 0, minWidth: 0, fontWeight: 700 }}
              >
                {sourcesOpen ? 'Hide sources' : 'View all sources'}
              </Button>
            </Stack>

            <Collapse in={sourcesOpen}>
              <Stack spacing={0.9} sx={{ pt: 0.25 }}>
                {readMoreContent.sources.map((source) => (
                  <Link
                    key={`${source.publisher}-${source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                  >
                    {source.publisher}: {source.label}
                  </Link>
                ))}
              </Stack>
            </Collapse>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Last reviewed: {readMoreContent.lastReviewed}
            </Typography>
          </Stack>
        </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

