import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LobbyStage } from './LobbyStage'
import warriorPortrait from '../../assets/heroes/warrior-base-thin.png'

describe('LobbyStage', () => {
  test('renders the 2d hero stage and empty friend slots around the character', () => {
    render(
      <LobbyStage
        portraitSrc={warriorPortrait}
        heroLevel={1}
        roomCode="777BA"
        friendSlots={2}
      />,
    )

    expect(screen.getByTestId('lobby-stage-shell')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-friend-slot-left')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-friend-slot-right')).toBeInTheDocument()
    expect(screen.getByAltText(/центральный батыр/i)).toBeInTheDocument()
  })
})
