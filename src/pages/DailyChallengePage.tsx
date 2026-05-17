import { Link, useNavigate } from 'react-router-dom'
import type { GameState } from '../game/types'
import { getTodayDailyChallenge } from '../play/daily-challenges'
import { getCurrentHeroArt } from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

function countPieces(state: GameState, color: 'white' | 'black') {
  return state.board.flat().filter((piece) => piece?.color === color).length
}

export function DailyChallengePage() {
  const navigate = useNavigate()
  const profile = useProgressStore((state) => state.profile)
  const challenge = getTodayDailyChallenge()
  const hero = profile
    ? getCurrentHeroArt(profile.classId, profile.level)
    : getCurrentHeroArt('warrior', 1)
  const whiteUnits = countPieces(challenge.initialGameState, 'white')
  const blackUnits = countPieces(challenge.initialGameState, 'black')

  return (
    <section
      data-testid="daily-mode-shell"
      className="relative min-h-screen overflow-hidden bg-[#14110d] px-4 py-6 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,145,255,0.12),_transparent_26%),radial-gradient(circle_at_right,_rgba(255,190,92,0.09),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.05),_transparent_26%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-white/54">
              Испытание дня
            </p>
            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">
              Испытание дня
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              Одна особая доска в день: короткий риск, редкая позиция и быстрый повод
              вернуться завтра.
            </p>
          </div>

          <Link
            to="/play"
            className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/14"
          >
            Назад к режимам
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
          <article
            className="overflow-hidden rounded-[2.6rem] border border-white/12 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8"
            style={{ background: challenge.accent }}
          >
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,16,28,0.82),rgba(10,10,18,0.94))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-white/50">
                    Только сегодня
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-white">{challenge.title}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/66">
                    {challenge.subtitle}
                  </p>
                </div>
                <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.8rem] border border-white/12 bg-white/8">
                  <img
                    src={hero.avatar}
                    alt="Аватар героя испытания"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/48">Цель</p>
                  <p className="mt-2 text-sm font-semibold text-white/88">{challenge.goal}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/48">Награда</p>
                  <p className="mt-2 text-lg font-black text-white">+{challenge.rewardXp} XP</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/48">Вражеский AI</p>
                  <p className="mt-2 text-lg font-black text-white">
                    {challenge.difficulty.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[2.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,30,0.9),rgba(8,9,16,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-white/50">
              Чтение позиции
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ['Белая сторона', `${whiteUnits} фигур`],
                ['Чёрная сторона', `${blackUnits} фигур`],
                ['Первый ход', challenge.initialGameState.currentTurn],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-white/48">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-amber-200/14 bg-amber-300/8 px-4 py-4 text-sm leading-7 text-white/70">
              Этот режим стартует не с обычной доски, а с заранее собранной боевой позиции.
              Правила и AI остаются прежними, меняется только входная сцена матча.
            </div>

            <button
              data-testid="launch-daily-cta"
              type="button"
              onClick={() =>
                navigate(profile ? `/game?mode=daily&challenge=${challenge.id}` : '/class-select')
              }
              className="mt-6 inline-flex rounded-[1.5rem] bg-[linear-gradient(135deg,#c084fc,#f59e0b)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-950"
            >
              {profile ? 'Войти в испытание' : 'Выбрать класс'}
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}
