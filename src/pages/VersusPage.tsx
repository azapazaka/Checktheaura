import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CLASS_META,
  getCurrentHeroArt,
  getHeroArt,
  getOpposingVisibleClass,
} from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

export function VersusPage() {
  const navigate = useNavigate()
  const profile = useProgressStore((state) => state.profile)
  const difficulty = useProgressStore((state) => state.settings.preferredDifficulty)

  useEffect(() => {
    if (!profile) {
      navigate('/class-select', { replace: true })
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/game?mode=training', { replace: true })
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, profile])

  if (!profile) {
    return null
  }

  const playerMeta = CLASS_META[profile.classId]
  const playerHero = getCurrentHeroArt(profile.classId, profile.level)
  const enemyClass = getOpposingVisibleClass(profile.classId)
  const enemyHero = getHeroArt(enemyClass)

  return (
    <section className="arcade-panel overflow-hidden rounded-[2.6rem] p-0">
      <div className="grid min-h-[38rem] gap-0 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(127,29,29,0.92),rgba(69,10,10,0.92))] p-6 sm:p-8">
          <div>
            <p className="arcade-kicker text-rose-100/70">Твоя сторона</p>
            <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              {playerMeta.title}
            </h2>
            <p className="mt-3 max-w-md text-base leading-7 text-white/74">
              {playerMeta.activeBonus}
            </p>
          </div>
          <div className="grid gap-4">
            <img
              src={playerHero.portrait}
              alt="Герой игрока"
              className="mx-auto h-[19rem] w-full object-contain drop-shadow-[0_24px_44px_rgba(0,0,0,0.45)] sm:h-[23rem]"
            />
            <div className="rounded-[1.6rem] border border-white/14 bg-black/18 px-4 py-4 text-sm text-white/72">
              Уровень {profile.level} • {profile.title}
            </div>
          </div>
        </div>

        <div className="grid place-items-center bg-[linear-gradient(180deg,rgba(8,12,30,0.94),rgba(15,20,46,0.9))] px-4 py-8">
          <div className="text-center">
            <p className="arcade-kicker text-white/58">Перед боем</p>
            <h1 className="mt-3 font-display text-6xl text-white sm:text-7xl">Versus</h1>
            <div className="mt-5 rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/74">
              {difficulty.toUpperCase()} AI
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/64">
              Короткая arcade-заставка перед реальным переходом на поле боя.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(12,74,110,0.92),rgba(17,24,39,0.94))] p-6 sm:p-8">
          <div>
            <p className="arcade-kicker text-sky-100/70">Сторона врага</p>
            <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              {enemyClass === 'warrior' ? 'Воин AI' : 'Стратег AI'}
            </h2>
            <p className="mt-3 max-w-md text-base leading-7 text-white/74">
              Противник использует противоположный стиль, чтобы поле боя ощущалось как
              живое столкновение двух разных батыров.
            </p>
          </div>
          <div className="grid gap-4">
            <img
              src={enemyHero.full}
              alt="Герой соперника"
              className="mx-auto h-[19rem] w-full object-contain drop-shadow-[0_24px_44px_rgba(0,0,0,0.45)] sm:h-[23rem]"
            />
            <div className="rounded-[1.6rem] border border-white/14 bg-black/18 px-4 py-4 text-sm text-white/72">
              Автовход на боевую доску...
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
