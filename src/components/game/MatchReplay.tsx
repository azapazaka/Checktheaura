import { useState } from 'react'
import { motion } from 'framer-motion'
import { applyMove, createInitialGameState } from '../../game/engine'
import type { MatchMove } from '../../game/types'
import { getBattlePiecePresentation } from '../../rpg/meta'
import type { ReplayMistake } from '../../coach/types'
import type { RpgClass } from '../../rpg/types'

export function MatchReplay({
  moveLog,
  mistakes,
  playerClass,
}: {
  moveLog: MatchMove[]
  mistakes: ReplayMistake[]
  playerClass: RpgClass
}) {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  
  // Compute states for all turns
  const states = [createInitialGameState()]
  for (const move of moveLog) {
    states.push(applyMove(states[states.length - 1], move))
  }

  const currentState = states[currentTurnIndex]
  const currentMistake = mistakes.find((m) => m.turnNumber === currentTurnIndex + 1)

  const handleNext = () => {
    if (currentTurnIndex < moveLog.length) setCurrentTurnIndex(currentTurnIndex + 1)
  }

  const handlePrev = () => {
    if (currentTurnIndex > 0) setCurrentTurnIndex(currentTurnIndex - 1)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentTurnIndex === 0}
          className="rounded-full bg-white/10 px-4 py-2 font-bold text-white hover:bg-white/20 disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-white/80">Turn {currentTurnIndex} / {moveLog.length}</span>
        <button
          onClick={handleNext}
          disabled={currentTurnIndex === moveLog.length}
          className="rounded-full bg-white/10 px-4 py-2 font-bold text-white hover:bg-white/20 disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      <div className="board-grid max-w-sm sm:max-w-md w-full relative">
        {currentState.board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isDarkSquare = (rowIndex + colIndex) % 2 === 1
            const presentation = piece
              ? getBattlePiecePresentation(playerClass, piece.color, piece.kind)
              : null
            
            const isBadMoveSrc = currentMistake?.madeMove.from.row === rowIndex && currentMistake?.madeMove.from.col === colIndex
            const isBadMoveDst = currentMistake?.madeMove.to.row === rowIndex && currentMistake?.madeMove.to.col === colIndex
            const isGoodMoveSrc = currentMistake?.betterMove.from.row === rowIndex && currentMistake?.betterMove.from.col === colIndex
            const isGoodMoveDst = currentMistake?.betterMove.to.row === rowIndex && currentMistake?.betterMove.to.col === colIndex

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="board-cell relative"
                style={{
                  background: isDarkSquare ? 'var(--board-dark)' : 'var(--board-light)',
                  boxShadow: isBadMoveSrc || isBadMoveDst
                    ? 'inset 0 0 0 4px rgba(239, 68, 68, 0.8)' // Red for bad
                    : isGoodMoveSrc || isGoodMoveDst
                      ? 'inset 0 0 0 4px rgba(34, 197, 94, 0.8)' // Green for good
                      : undefined
                }}
              >
                {presentation && piece ? (
                  <motion.span
                    layoutId={`replay-${piece.id}`}
                    className={[
                      'battle-mini',
                      piece.color === 'white' ? 'battle-mini--white' : 'battle-mini--black',
                    ].join(' ')}
                  >
                    <img
                      src={presentation.mini}
                      alt="piece"
                      className="h-full w-full object-contain"
                    />
                  </motion.span>
                ) : null}
              </div>
            )
          })
        )}
      </div>
      
      {currentMistake && (
        <div className="mt-6 rounded-2xl bg-red-500/20 p-4 border border-red-500/50 w-full max-w-md text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-red-400">Coach Insight</p>
          <p className="mt-2 text-white leading-relaxed">{currentMistake.explanation}</p>
        </div>
      )}
    </div>
  )
}
