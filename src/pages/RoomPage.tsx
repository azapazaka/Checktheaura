import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { appendNextParam } from '../auth/next-path'
import { useAuth } from '../auth/AuthContext'
import { isAuthorizedFetchError } from '../cloud/http'
import {
  fetchRoom,
  joinRoom,
  moveInRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
} from '../cloud/room-service'
import type { RoomJoinErrorCode, RoomRecord } from '../cloud/types'
import { getGameOutcome, getLegalMoves } from '../game/engine'
import type { BoardCoord, PieceColor } from '../game/types'
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

function getRoomErrorMessage(code?: RoomJoinErrorCode, fallback?: string) {
  switch (code) {
    case 'ROOM_NOT_FOUND':
      return 'Комната не найдена. Проверь код или попроси новый invite-link.'
    case 'ROOM_FULL':
      return 'Комната уже занята двумя игроками.'
    case 'UNAUTHORIZED':
      return 'Войди в облачный аккаунт, чтобы присоединиться к комнате.'
    case 'INVALID_ROOM_CODE':
      return 'Код комнаты должен содержать 5 символов.'
    default:
      return fallback ?? 'Эту комнату не удалось загрузить.'
  }
}

export function RoomPage() {
  const { roomCode = '' } = useParams()
  const location = useLocation()
  const normalizedRoomCode = roomCode.trim().toUpperCase()
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    isProfileLoading,
    sessionMode,
  } = useAuth()
  const profile = useProgressStore((state) => state.profile)
  const [room, setRoom] = useState<RoomRecord | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<BoardCoord | null>(null)
  const [isSubmittingMove, setIsSubmittingMove] = useState(false)
  const nextPath = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    if (!user || !profile || !normalizedRoomCode) {
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        setIsJoining(true)
        let nextRoom = await fetchRoom(normalizedRoomCode)

        if (!nextRoom) {
          const joinResult = await joinRoom(normalizedRoomCode)
          nextRoom = joinResult.room
        } else {
          const isMember =
            nextRoom.host_user_id === user.id || nextRoom.guest_user_id === user.id

          if (!isMember) {
            const joinResult = await joinRoom(normalizedRoomCode)
            nextRoom = joinResult.room
          }
        }

        if (isMounted) {
          setRoom(nextRoom)
          setErrorMessage(null)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            isAuthorizedFetchError(error)
              ? getRoomErrorMessage(error.code as RoomJoinErrorCode | undefined, error.message)
              : error instanceof Error
                ? getRoomErrorMessage(undefined, error.message)
                : 'Не удалось загрузить комнату.',
          )
        }
      } finally {
        if (isMounted) {
          setIsJoining(false)
        }
      }
    }

    void load()

    const channel = subscribeToRoom(normalizedRoomCode, (nextRoom) => {
      if (isMounted) {
        setRoom(nextRoom)
      }
    })

    return () => {
      isMounted = false
      unsubscribeFromRoom(channel)
    }
  }, [normalizedRoomCode, profile, user])

  const currentPlayerColor = room && user ? roomPlayerColor(room, user.id) : null
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

    return `${window.location.origin}/rooms/${normalizedRoomCode}`
  }, [normalizedRoomCode])
  const isWaitingForRoom =
    Boolean(user && profile && normalizedRoomCode) && !room && !errorMessage

  if (isAuthLoading || isProfileLoading || isWaitingForRoom) {
    return (
      <section className="arcade-panel rounded-[2.5rem] p-8 text-center">
        <p className="arcade-kicker">Room Sync</p>
        <h2 className="mt-3 font-display text-4xl text-white">Поднимаем комнату...</h2>
      </section>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={appendNextParam('/auth', nextPath)} replace />
  }

  if (!profile) {
    if (sessionMode === 'upgrading') {
      return <Navigate to={appendNextParam('/upgrade', nextPath)} replace />
    }

    if (sessionMode === 'onboarding') {
      return <Navigate to={appendNextParam('/onboarding', nextPath)} replace />
    }

    return (
      <section className="arcade-panel rounded-[2.5rem] p-8 text-center">
        <p className="arcade-kicker">Cloud Profile</p>
        <h2 className="mt-3 font-display text-4xl text-white">Сначала подготовим профиль</h2>
        <p className="mt-4 text-white/72">
          Заверши облачный профиль, и мы сразу вернём тебя в комнату.
        </p>
      </section>
    )
  }

  if (errorMessage || !room || !currentPlayerColor) {
    return (
      <section className="arcade-panel rounded-[2.5rem] p-8">
        <h2 className="font-display text-4xl text-white">Комната недоступна</h2>
        <p className="mt-4 text-white/72">
          {errorMessage ?? 'Эту комнату не удалось загрузить.'}
        </p>
      </section>
    )
  }

  const playerLabel = currentPlayerColor === 'white' ? 'Хост / Белые' : 'Гость / Чёрные'

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="arcade-panel overflow-hidden rounded-[2.5rem] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="arcade-kicker">Комната друзей</p>
            <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              Комната {room.room_code}
            </h1>
            <p className="mt-3 text-sm text-white/68">{playerLabel}</p>
            {isJoining ? (
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-100/78">
                Подключаем к дуэли...
              </p>
            ) : null}
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
              Копировать приглашение
            </button>
            <Link
              to="/"
              className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84"
            >
              Лобби
            </Link>
          </div>
        </div>

        {room.status === 'waiting' || !room.guest_user_id ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-white/18 bg-white/6 px-6 py-10 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">Ждём друга</p>
            <p className="mt-4 text-lg text-white/82">
              Поделись кодом <strong className="text-white">{room.room_code}</strong> или
              отправь ссылку на комнату.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                [
                  'Текущий ход',
                  room.game_state.currentTurn === currentPlayerColor ? 'Твой ход' : 'Ход врага',
                ],
                ['Твои фигуры', String(currentPlayerColor === 'white' ? whiteUnits : blackUnits)],
                ['Фигуры врага', String(currentPlayerColor === 'white' ? blackUnits : whiteUnits)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
                >
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
                                error instanceof Error ? error.message : 'Ход не прошёл.',
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
                Матч завершён. Победитель: {outcome.winner ?? 'ничья'}.
              </div>
            ) : null}
          </>
        )}
      </div>

      <aside className="grid gap-5">
        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h2 className="font-display text-3xl text-white">Состояние комнаты</h2>
          <div className="mt-5 space-y-3">
            {[
              ['Статус', room.status],
              ['Счётчик ходов', String(room.game_state.moves.length)],
              ['Текущий ход', room.game_state.currentTurn],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4"
              >
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
