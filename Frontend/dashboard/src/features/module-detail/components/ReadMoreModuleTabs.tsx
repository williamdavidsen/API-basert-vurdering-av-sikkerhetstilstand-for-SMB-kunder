import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import type { DashboardModuleKey } from '../../assessment/model/assessment.types'
import { routes } from '../../../shared/constants/routes'

export type ReadMoreActiveTab = DashboardModuleKey | 'pqc'

const moduleTabs: Array<{ key: DashboardModuleKey; label: string }> = [
  { key: 'ssl-tls', label: 'TLS / SSL' },
  { key: 'http-headers', label: 'HTTP Headers' },
  { key: 'email', label: 'E-mail' },
  { key: 'reputation', label: 'Domain / IP reputation' },
]

const pqcTab = { key: 'pqc' as const, label: 'PQC readiness' }

type ReadMoreModuleTabsProps = {
  domain: string
  activeTab: ReadMoreActiveTab
}

function tabHref(domain: string, tab: ReadMoreActiveTab): string {
  const encodedDomain = encodeURIComponent(domain)
  if (tab === 'pqc') {
    return `${routes.dashboard}/${encodedDomain}/pqc`
  }
  return `${routes.dashboard}/${encodedDomain}/${tab}`
}

export function ReadMoreModuleTabs({ domain, activeTab }: ReadMoreModuleTabsProps) {
  const allTabs: Array<{ key: ReadMoreActiveTab; label: string }> = [...moduleTabs, pqcTab]

  return (
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
        {allTabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <Button
              key={tab.key}
              component={RouterLink}
              to={tabHref(domain, tab.key)}
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
  )
}
