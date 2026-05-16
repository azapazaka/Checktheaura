import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGameOutcome, getLegalMoves } from '../game/engine'
import type { BoardCoord, PieceColor } from '../game/types'
import { useAuth } from '../auth/AuthContext'
import { fetchRoom, joinRoom, moveInRoom, subscribeToRoom, unsubscribeFromRoom } from '../cloud/room-service'
import type { RoomRecord } from '../cloud/types'
import { getBattlePiecePresentation } from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

function isSameCoord(left: BoardCoord | null, right: BoardCoord | null) {
  return left?.row === right?.row && left?.col === right?.col
}

function roomPlayerColor(room: RoomRecord, userId: string): PieceColor {
  return room.host_user_id === userId ? 'white' : 'black'
}

function countPieces(room: RoomRecord, color: PieceColor) {
  return room.game_state.board.flat().filter((piece) => piece?.color === color).length
}

export function RoomPage() {
  const { roomCode = '' } = useParams()
  const { user } = useAuth()
  const profile = useProgressStore((state) => state.profile)
  const [room, setRoom] = useState<RoomRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<BoardCoord | null>(null)
  const [isSubmittingMove, setIsSubmittingMove] = useState(false)

  useEffect(() => {
    if (!user || !roomCode) {
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        let nextRoom = await fetchRoom(roomCode)

        if (!nextRoom) {
          throw new Error('Room not found.')
        }

        const isMember =
          nextRoom.host_user_id === user.id || nextRoom.guest_user_id === user.id

        if (!isMember) {
          const joinResult = await joinRoom(roomCode)
          nextRoom = joinResult.room
        }

        if (isMounted) {
          setRoom(nextRoom)
          setErrorMessage(null)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to load room.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    const channel = subscribeToRoom(roomCode, (nextRoom) => {
      if (isMounted) {
        setRoom(nextRoom)
      }
    })

    return () => {
      isMounted = false
      unsubscribeFromRoom(channel)
    }
  }, [roomCode, user])

  const currentPlayerColor =
    room && user ? roomPlayerColor(room, user.id) : null
  const legalMoves = room ? getLegalMoves(room.game_state) : []
  const selectedMoves = selectedSquare
    ? legalMoves.filter((move) => isSameCoord(move.from, selectedSquare))
    : []
  const outcome = room ? getGameOutcome(room.game_state) : null
  const whiteUnits = room ? countPieces(room, 'white') : 0
  const blackUnits = room ? countPieces(room, 'black') : 0
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return `${window.location.origin}/rooms/${roomCode}`
  }, [roomCode])

  if (isLoading) {
    return null
  }

  if (!user || !profile) {
    return null
  }

  if (errorMessage || !room || !currentPlayerColor) {
    return (
      <section className="arcade-panel rounded-[2.5rem] p-8">
        <h2 className="font-display text-4xl text-white">Room unavailable</h2>
        <p className="mt-4 text-white/72">{errorMessage ?? 'This room could not be loaded.'}</p>
      </section>
    )
  }

  const playerLabel = currentPlayerColor === 'white' ? 'Host / White' : 'Guest / Black'

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="arcade-panel overflow-hidden rounded-[2.5rem] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="arcade-kicker">Friend room</p>
            <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              Room {room.room_code}
            </h1>
            <p className="mt-3 text-sm text-white/68">{playerLabel}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (navigator.clipboard?.writeText) {
                  void navigator.clipboard.writeText(shareUrl)
                }
              }}
              className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84"
            >
              Copy invite
            </button>
            <Link
              to="/"
              className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84"
            >
              Lobby
            </Link>
          </div>
        </div>

        {room.status === 'waiting' || !room.guest_user_id ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-white/18 bg-white/6 px-6 py-10 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">Waiting for friend</p>
            <p className="mt-4 text-lg text-white/82">
              Share code <strong className="text-white">{room.room_code}</strong> or send the room link.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ['Current turn', room.game_state.currentTurn === currentPlayerColor ? 'Your turn' : 'Enemy turn'],
                ['Your units', String(currentPlayerColor === 'white' ? whiteUnits : blackUnits)],
                ['Enemy units', String(currentPlayerColor === 'white' ? blackUnits : whiteUnits)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/58">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[2.2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(188,216,255,0.16),rgba(18,23,58,0.28))] p-3 sm:p-4">
              <div className="board-grid">
                {room.game_state.board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const coord = { row: rowIndex, col: colIndex }
                    const isDarkSquare = (rowIndex + colIndex) % 2 === 1
                    const targetMove = selectedMoves.find((move) => isSameCoord(move.to, coord))
                    const isSelected = isSameCoord(selectedSquare, coord)
                    const canSelect = legalMoves.some((move) => isSameCoord(move.from, coord))
                    const presentation = piece
                      ? getBattlePiecePresentation(profile.classId, piece.color, piece.kind)
                      : null

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        aria-label={`room-cell ${rowIndex}-${colIndex}`}
                        onClick={async () => {
                          if (room.game_state.currentTurn !== currentPlayerColor || isSubmittingMove) {
                            return
                          }

                          if (targetMove) {
                            setIsSubmittingMove(true)
                            try {
                              const response = await moveInRoom(room.room_code, targetMove)
                              setRoom(response.room)
                              setSelectedSquare(null)
                            } catch (error) {
                              setErrorMessage(
                                error instanceof Error ? error.message : 'Move failed.',
                              )
                            } finally {
                              setIsSubmittingMove(false)
                            }
                            return
                          }

                          if (piece?.color === currentPlayerColor && canSelect) {
                            setSelectedSquare(coord)
                            return
                          }

                          setSelectedSquare(null)
                        }}
                        className="board-cell"
                        style={{
                          background: targetMove
                            ? 'var(--board-highlight)'
                            : isDarkSquare
                              ? 'var(--board-dark)'
                              : 'var(--board-light)',
                          boxShadow: isSelected
                            ? 'inset 0 0 0 4px rgba(255,255,255,0.44)'
                            : targetMove && targetMove.captured.length > 0
                              ? 'inset 0 0 0 4px var(--board-capture)'
                              : undefined,
                        }}
                      >
                        {presentation && piece ? (
                          <span
                            className={[
                              'battle-mini',
                              piece.color === 'white' ? 'battle-mini--white' : 'battle-mini--black',
                            ].join(' ')}
                          >
                            <img
                              src={presentation.mini}
                              alt={`${presentation.heroClass} ${piece.kind}`}
                              className="h-full w-full object-contain"
                            />
                            {piece.kind === 'king' ? (
                              <span className="battle-mini__crown">K</span>
                            ) : null}
                          </span>
                        ) : null}
                      </button>
                    )
                  }),
                )}
              </div>
            </div>

            {outcome ? (
              <div className="mt-5 rounded-[1.8rem] border border-amber-300/20 bg-amber-400/10 px-5 py-4 text-sm text-white/84">
                Match completed. Winner: {outcome.winner ?? 'draw'}.
              </div>
            ) : null}
          </>
        )}
      </div>

      <aside className="grid gap-5">
        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h2 className="font-display text-3xl text-white">Room State</h2>
          <div className="mt-5 space-y-3">
            {[
              ['Status', room.status],
              ['Move count', String(room.game_state.moves.length)],
              ['Current turn', room.game_state.currentTurn],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/58">{label}</p>
                <p className="mt-2 text-sm leading-6 text-white/82">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  )
}
