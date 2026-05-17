import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import warriorPortrait from '../../assets/heroes/warrior-base-thin.png'
import { LobbyStage } from './LobbyStage'

describe('LobbyStage', () => {
  test('renders the hero stage with empty ally sockets and arena pills', () => {
    render(
      <LobbyStage
        portraitSrc={warriorPortrait}
        heroLevel={1}
        friendSlots={2}
        stageLabel="SANCTUM"
      />,
    )

    expect(screen.getByTestId('lobby-stage-shell')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-friend-slot-left')).toBeInTheDocument()
    expect(screen.getByTestId('lobby-friend-slot-right')).toBeInTheDocument()
    expect(screen.getByText(/SANCTUM/i)).toBeInTheDocument()
    expect(screen.getByText(/ALLY SLOTS 2/i)).toBeInTheDocument()
    expect(screen.queryByText(/ROOM/i)).not.toBeInTheDocument()
    expect(screen.getByAltText(/central batyr hero/i)).toBeInTheDocument()
  })
})
