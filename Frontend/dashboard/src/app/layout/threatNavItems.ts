import mailIcon from '../../assets/images/threat/icons/mail.svg'
import shieldIcon from '../../assets/images/threat/icons/shield.svg'
import webIcon from '../../assets/images/threat/icons/web.svg'
import { routes } from '../../shared/constants/routes'

export const threatNavItems = [
  { label: 'Phishing & spoofing', to: routes.threatPhishing, icon: mailIcon },
  { label: 'Weak TLS / certs', to: routes.threatWeakTls, icon: shieldIcon },
  { label: 'Missing headers', to: routes.threatMissingHeaders, icon: webIcon },
]
