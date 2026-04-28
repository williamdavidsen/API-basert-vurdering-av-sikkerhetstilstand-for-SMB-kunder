import type { HomeSlide } from '../model/home.types'
import hero1Image from '../../../assets/images/home/hero01.png'
import hero2Image from '../../../assets/images/home/hero02.png'
import hero3Image from '../../../assets/images/home/hero03.png'

export const homeSlides: HomeSlide[] = [
  {
    id: 'certificate-hygiene',
    titleParts: [
      { text: 'Understand Your' },
      { text: 'Security at a Glance', tone: 'accent' },
    ],
    description:
      'Quickly analyze your domain and identify potential security risks before they become critical.',
    imageUrl: hero1Image,
    imageAlt: 'Person working on laptop with phone near security dashboard',
    accentColor: '#3a79d0',
  },
  {
    id: 'risk-detection',
    titleParts: [
      { text: 'Detect Risks' },
      { text: 'Before They Impact You', tone: 'accent' },
    ],
    description:
      'Get a clear security score and actionable insights to improve your system protection.',
    imageUrl: hero2Image,
    imageAlt: 'Green cyber security network illustration with central sphere',
    accentColor: '#319b86',
  },
  {
    id: 'security-analysis',
    titleParts: [
      { text: 'Comprehensive' },
      { text: 'Security Analysis', tone: 'accent' },
    ],
    description:
      'We check your TLS configuration, HTTP security headers, email protection, and domain reputation.',
    imageUrl: hero3Image,
    imageAlt: 'Blue digital lock illustration representing a full security analysis',
    accentColor: '#359fbc',
  },
]
