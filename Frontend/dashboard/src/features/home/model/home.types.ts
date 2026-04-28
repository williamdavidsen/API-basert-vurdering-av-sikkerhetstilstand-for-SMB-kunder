export type HomeSlideTitlePart = {
  text: string
  tone?: 'base' | 'accent'
}

export type HomeSlide = {
  id: string
  titleParts: HomeSlideTitlePart[]
  description: string
  imageUrl: string
  imageAlt: string
  accentColor: string
}
