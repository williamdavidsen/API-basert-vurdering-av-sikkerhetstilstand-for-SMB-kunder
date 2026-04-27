import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../../../../Frontend/dashboard/src/app/providers/AppProviders'

describe('AppProviders', () => {
  it('wraps children with the shared theme and baseline providers', () => {
    render(
      <AppProviders>
        <div>Provider child</div>
      </AppProviders>,
    )

    expect(screen.getByText('Provider child')).toBeInTheDocument()
  })
})
