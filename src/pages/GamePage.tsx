import { startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { audioSystem } from '../game/audio'
import { chooseAiMove } from '../game/ai'
import {
  applyMove,
  cloneGameState,
  createInitialGameState,
  getGameOutcome,
  getLegalMoves,
} from '../game/engine'
import { summarizeFinishedMatch } from '../game/match'
import type { BoardCoord, GameState, Move } from '../game/types'
import { getDailyChallengeById, getTodayDailyChallenge } from '../play/daily-challenges'
import type { PlayMode } from '../play/types'
import {
  CLASS_META,
  getBattlePiecePresentation,
  getCurrentHeroArt,
  getHeroArt,
  getOpposingVisibleClass,
} from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

function isSameCoord(left: BoardCoord | null, right: BoardCoord | null) {
  return left?.row === right?.row && left?.col === right?.col
}

function isHintSquare(
  hint: Move | null,
  coord: BoardCoord,
  kind: 'from' | 'to',
) {
  if (!hint) {
    return false
  }

  return isSameCoord(kind === 'from' ? hint.from : hint.to, coord)
}

function countPieces(state: GameState, color: 'white' | 'black') {
  return state.board.flat().filter((piece) => piece?.color === color).length
}

export function GamePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const profile = useProgressStore((state) => state.profile)
  const difficulty = useProgressStore((state) => state.settings.preferredDifficulty)
  const finishMatch = useProgressStore((state) => state.finishMatch)
  const requestedMode = searchParams.get('mode')
  const activeMode: PlayMode = requestedMode === 'daily' ? 'daily' : 'training'
  const activeDailyChallenge =
    activeMode === 'daily'
      ? getDailyChallengeById(searchParams.get('challenge')) ?? getTodayDailyChallenge()
      : null
  const effectiveDifficulty = activeDailyChallenge?.difficulty ?? difficulty
  const initialState = useMemo<GameState>(
    () =>
      activeDailyChallenge
        ? cloneGameState(activeDailyChallenge.initialGameState)
        : createInitialGameState(),
    [activeDailyChallenge],
  )
  const [gameState, setGameState] = useState<GameState>(() => initialState)
  const [selectedSquare, setSelectedSquare] = useState<BoardCoord | null>(null)
  const [shadowHint, setShadowHint] = useState<Move | null>(null)
  const [shadowHintUsed, setShadowHintUsed] = useState(false)
  const finalizedRef = useRef(false)

  const gameOutcome = getGameOutcome(gameState)
  const legalMoves = getLegalMoves(gameState)
  const selectedMoves = selectedSquare
    ? legalMoves.filter((move) => isSameCoord(move.from, selectedSquare))
    : []
  const classMeta = profile ? CLASS_META[profile.classId] : null
  const isShadow = profile?.classId === 'shadow'
  const canUseShadowHint =
    isShadow && !shadowHintUsed && gameState.currentTurn === 'white' && !gameOutcome

  useEffect(() => {
    if (!profile) {
      navigate('/class-select', { replace: true })
    }
  }, [navigate, profile])

  const runAiTurn = useEffectEvent(() => {
    const move = chooseAiMove(gameState, effectiveDifficulty, 'black')
    if (!move) {
      return
    }

    setShadowHint(null)
    setGameState((current) => applyMove(current, move))

    if (move.captured.length > 0) audioSystem.playCapture()
    else audioSystem.playMove()
  })

  useEffect(() => {
    if (!profile || gameOutcome || gameState.currentTurn !== 'black') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      runAiTurn()
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [effectiveDifficulty, gameOutcome, gameState.currentTurn, profile])

  useEffect(() => {
    if (!profile || !gameOutcome || finalizedRef.current) {
      return
    }

    finalizedRef.current = true
    const summary = summarizeFinishedMatch({
      state: gameState,
      outcome: gameOutcome,
      difficulty: effectiveDifficulty,
      playerClass: profile.classId,
      playerColor: 'white',
      usedShadowHint: shadowHintUsed,
    })

    startTransition(() => {
      finishMatch(summary)
      navigate('/results')
    })
  }, [
    effectiveDifficulty,
    finishMatch,
    gameOutcome,
    gameState,
    navigate,
    profile,
    shadowHintUsed,
  ])

  const playerHero = profile ? getCurrentHeroArt(profile.classId, profile.level) : null
  const opponentClass = profile ? getOpposingVisibleClass(profile.classId) : 'strategist'
  const opponentHero = getHeroArt(opponentClass)
  const whiteUnits = useMemo(() => countPieces(gameState, 'white'), [gameState])
  const blackUnits = useMemo(() => countPieces(gameState, 'black'), [gameState])

  if (!profile || !classMeta || !playerHero) {
    return null
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="arcade-panel overflow-hidden rounded-[2.5rem] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="battle-banner battle-banner--player">
            <div className="battle-banner__avatar">
              <img
                src={playerHero.avatar}
                alt="Аватар героя игрока"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Ты</p>
              <p className="mt-1 font-display text-2xl text-white">{classMeta.title}</p>
              <p className="mt-1 text-sm text-white/64">Осталось фигур: {whiteUnits}</p>
            </div>
          </div>

          <div className="rounded-full border border-white/16 bg-black/20 px-4 py-2 text-center text-sm font-semibold uppercase tracking-[0.24em] text-white/78">
            {gameState.currentTurn === 'white' ? 'Твой ход' : 'Ход врага'}
          </div>

          <div className="battle-banner battle-banner--enemy">
            <div className="battle-banner__avatar">
              <img
                src={opponentHero.fullAvatar}
                alt="Аватар героя соперника"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Враг</p>
              <p className="mt-1 font-display text-2xl text-white">
                {opponentClass === 'warrior' ? 'Воин AI' : 'Стратег AI'}
              </p>
              <p className="mt-1 text-sm text-white/64">Осталось фигур: {blackUnits}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            ['Сложность', effectiveDifficulty.toUpperCase()],
            ['Ходы', String(gameState.moves.length)],
            ['Цепочка взятий', gameState.forcedSequence ? 'Зафиксирована' : 'Свободна'],
            [
              'Совет',
              !isShadow
                ? 'Выкл'
                : shadowHintUsed
                  ? 'Потрачен'
                  : gameState.currentTurn === 'white'
                    ? 'Готов'
                    : 'Ожидание',
            ],
          ].map(([label, value]) => (
            <div key={label} className="arcade-chip min-h-[4.2rem] min-w-[10rem] flex-col items-start">
              <span className="text-xs uppercase tracking-[0.22em] text-white/58">{label}</span>
              <span className="mt-2 text-lg font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[2.2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(188,216,255,0.16),rgba(18,23,58,0.28))] p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="arcade-kicker">Фаза боя</p>
              <h2 data-testid="game-heading" className="mt-2 font-display text-4xl text-white">
                {activeDailyChallenge ? 'Испытание дня' : 'Боевая доска'}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/66">
              Игровые фигуры визуально заменены на мини-героев. Логика шашек и
              обязательных рубок остаётся прежней.
            </p>
          </div>

          <div className="board-grid">
            {gameState.board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const coord = { row: rowIndex, col: colIndex }
                const isDarkSquare = (rowIndex + colIndex) % 2 === 1
                const targetMove = selectedMoves.find((move) =>
                  isSameCoord(move.to, coord),
                )
                const isSelected = isSameCoord(selectedSquare, coord)
                const canSelect = legalMoves.some((move) =>
                  isSameCoord(move.from, coord),
                )
                const isHintFrom = isHintSquare(shadowHint, coord, 'from')
                const isHintTo = isHintSquare(shadowHint, coord, 'to')
                const presentation = piece
                  ? getBattlePiecePresentation(profile.classId, piece.color, piece.kind)
                  : null

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    aria-label={`cell ${rowIndex}-${colIndex}`}
                    onClick={() => {
                      if (gameState.currentTurn !== 'white') {
                        return
                      }

                      if (targetMove) {
                        setShadowHint(null)
                        setGameState((current) => applyMove(current, targetMove))
                        setSelectedSquare(null)

                        if (targetMove.captured.length > 0) audioSystem.playCapture()
                        else if (targetMove.to.row === 0) audioSystem.playPromote()
                        else audioSystem.playMove()
                        return
                      }

                      if (piece?.color === 'white' && canSelect) {
                        setSelectedSquare(coord)
                        audioSystem.playSelect()
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
                          : isHintFrom
                            ? 'inset 0 0 0 4px rgba(250,250,255,0.92)'
                            : isHintTo
                              ? 'inset 0 0 0 4px var(--accent)'
                              : undefined,
                      filter: canSelect && piece?.color === 'white' ? 'saturate(1.12)' : 'none',
                    }}
                  >
                    {presentation && piece ? (
                      <motion.span
                        layoutId={piece.id}
                        data-testid={`battle-mini-${piece.id}`}
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
                      </motion.span>
                    ) : null}
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </div>

      <aside className="grid gap-5">
        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Боевой HUD</h3>
          <div className="mt-5 space-y-3">
            {[
              ['Бонус класса', classMeta.activeBonus],
              ['Доступные ходы', `${legalMoves.length}`],
              ['Счётчик без взятия', `${gameState.moveCountWithoutCapture}`],
              [
                'Обязательная цепочка',
                gameState.forcedSequence
                  ? `Продолжай с ${gameState.forcedSequence.row}-${gameState.forcedSequence.col}`
                  : 'Цепочка не зафиксирована',
              ],
              ...(activeDailyChallenge
                ? [
                    ['Испытание', activeDailyChallenge.title],
                    ['Награда', `+${activeDailyChallenge.rewardXp} XP`],
                  ]
                : []),
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/58">{label}</p>
                <p className="mt-2 text-sm leading-6 text-white/82">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {isShadow ? (
              <button
                type="button"
                onClick={() => {
                  if (!canUseShadowHint) {
                    return
                  }

                  const recommendedMove = chooseAiMove(
                    gameState,
                    effectiveDifficulty,
                    'white',
                  )
                  if (!recommendedMove) {
                    return
                  }

                  setSelectedSquare(recommendedMove.from)
                  setShadowHint(recommendedMove)
                  setShadowHintUsed(true)
                }}
                disabled={!canUseShadowHint}
                className="rounded-[1.3rem] border border-white/16 bg-white/8 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Теневой совет
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                finalizedRef.current = false
                setGameState(cloneGameState(initialState))
                setSelectedSquare(null)
                setShadowHint(null)
                setShadowHintUsed(false)
              }}
              className="rounded-[1.3rem] bg-[linear-gradient(90deg,#ffd54f,#ff9f1c)] px-4 py-3 text-sm font-bold text-slate-950"
            >
              Перезапустить матч
            </button>
          </div>

          {shadowHint ? (
            <p className="mt-4 rounded-[1.4rem] border border-white/12 bg-black/18 px-4 py-4 text-sm leading-6 text-white/74">
              Совет активирован: выделены фигура и клетка назначения для лучшего
              следующего хода.
            </p>
          ) : null}
        </section>

        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Правила доски</h3>
          <p className="mt-4 text-sm leading-7 text-white/68">
            Если доступно взятие, обычные ходы автоматически теряют приоритет, и
            игра ведёт тебя в обязательную рубку. После взятия цепочка продолжается
            автоматически, пока правила шашек требуют продолжать.
          </p>
        </section>
      </aside>
    </section>
  )
}
