import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import { ClassSelectPage } from './ClassSelectPage'
import { useProgressStore } from '../store/progress-store'

describe('ClassSelectPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
  })

  test('shows only warrior and strategist as starter classes', () => {
    render(
      <MemoryRouter>
        <ClassSelectPage />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('class-select-warrior')).toBeInTheDocument()
    expect(screen.getByTestId('class-select-strategist')).toBeInTheDocument()
    expect(screen.queryByTestId('class-select-shadow')).not.toBeInTheDocument()
    expect(screen.getByAltText(/warrior hero/i)).toBeInTheDocument()
    expect(screen.getByAltText(/strategist hero/i)).toBeInTheDocument()
  })
})
