import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import type { HomeSlide } from '../model/home.types'

type HeroSlideProps = {
  slide: HomeSlide
  isActive: boolean
  reducedMotion: boolean
}

export function HeroSlide({ slide, isActive, reducedMotion }: HeroSlideProps) {
  const [hasImageError, setHasImageError] = useState(false)

  useEffect(() => {
    setHasImageError(false)
  }, [slide.id])

  if (hasImageError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: { xs: 250, md: 320 },
          display: 'flex',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(0, 166, 186, 0.12) 0%, rgba(255, 255, 255, 0.98) 45%, rgba(0, 166, 186, 0.18) 100%)',
          px: { xs: 2.5, md: 4 },
        }}
      >
        <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
          <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: '0.08em' }}>
            Security overview
          </Typography>
          <Typography component="h2" variant="h4" sx={{ color: 'secondary.dark', fontWeight: 900, lineHeight: 1.1 }}>
            {slide.title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 380 }}>
            {slide.description}
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={slide.imageUrl}
      alt={slide.imageAlt}
      onError={() => setHasImageError(true)}
      sx={{
        width: '100%',
        height: { xs: 250, md: 320 },
        objectFit: 'cover',
        objectPosition: { xs: 'left center', sm: 'center' },
        transform: reducedMotion ? 'none' : isActive ? 'scale(1.02)' : 'scale(1)',
        transition: reducedMotion ? 'none' : 'transform 420ms ease-out',
        display: 'block',
      }}
    />
  )
}
