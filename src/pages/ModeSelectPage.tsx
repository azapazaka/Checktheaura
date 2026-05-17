import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import brandCrest from '../assets/brand-crest.png'
import dailyEmeraldCanyonArt from '../assets/daily-emerald-canyon-art.png'
import duelStormArenaArt from '../assets/duel-storm-arena-art.png'
import trainingSteppeArt from '../assets/training-steppe-art.png'
import { getTodayDailyChallenge } from '../play/daily-challenges'
import { getCurrentHeroArt, getHeroArt, getOpposingVisibleClass } from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

function TrainingModeCard({
  eyebrow,
  title,
  line,
  detail,
  ctaLabel,
  onClick,
  testId,
}: {
  eyebrow: string
  title: string
  line: string
  detail: string
  ctaLabel: string
  onClick: () => void
  testId: string
}) {
  return (
    <article
      data-testid={testId}
      className="group relative overflow-hidden rounded-[2.6rem] border border-amber-100/14 bg-[#20150d] shadow-[0_36px_120px_rgba(0,0,0,0.42)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${trainingSteppeArt})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.7)_30%,rgba(0,0,0,0.38)_62%,rgba(0,0,0,0.16)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,216,132,0.22),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_26%,rgba(0,0,0,0.28)_100%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,240,207,0.92),transparent)] opacity-80" />

      <div className="relative z-10 flex min-h-[30rem] flex-col justify-between p-8 sm:p-10 xl:p-9">
        <div className="max-w-[23rem]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-amber-100/72">
            {eyebrow}
          </p>
          <h2 className="mt-5 font-display text-4xl text-white sm:text-[2.8rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-[22rem] text-base font-semibold leading-7 text-white/88">
            {line}
          </p>
          <p className="mt-4 max-w-[23rem] text-sm leading-7 text-white/72 sm:text-[0.97rem]">
            {detail}
          </p>
        </div>

        <div className="flex flex-col items-start gap-4">
          <button
            data-testid={`mode-cta-${testId.replace('mode-card-', '')}`}
            type="button"
            onClick={onClick}
            className="inline-flex items-center justify-center rounded-[1.5rem] border border-amber-100/26 bg-white/10 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_20px_40px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-amber-50/38 hover:bg-amber-200/18"
          >
            {ctaLabel}
          </button>
          <div className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/56 backdrop-blur-sm">
            Степной полигон • закатная арена
          </div>
        </div>
      </div>
    </article>
  )
}

function DuelVisual({
  hostAvatar,
  rivalAvatar,
}: {
  hostAvatar: string
  rivalAvatar: string
}) {
  return (
    <div className="relative mx-auto flex w-fit items-center gap-4 rounded-[2rem] border border-cyan-100/12 bg-[linear-gradient(135deg,rgba(5,20,28,0.38),rgba(18,44,52,0.16))] px-5 py-4 shadow-[0_20px_44px_rgba(0,0,0,0.28)] backdrop-blur-[8px]">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_32%,rgba(56,189,248,0.08)_100%)]" />

      <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-[1.6rem] border border-rose-200/24 bg-black/24 p-2 shadow-[0_0_28px_rgba(251,113,133,0.24)]">
        <img src={hostAvatar} alt="Аватар хозяина комнаты" className="h-full w-full object-contain" />
      </div>

      <div className="relative grid h-12 w-12 place-items-center rounded-full border border-white/14 bg-white/10 text-xs font-black uppercase tracking-[0.24em] text-white/82 shadow-[0_0_22px_rgba(125,211,252,0.18)]">
        VS
      </div>

      <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-[1.6rem] border border-cyan-200/24 bg-black/24 p-2 shadow-[0_0_28px_rgba(34,211,238,0.24)]">
        <img src={rivalAvatar} alt="Аватар соперника" className="h-full w-full object-contain" />
      </div>
    </div>
  )
}

function DuelModeCard({
  eyebrow,
  title,
  line,
  detail,
  ctaLabel,
  onClick,
  visual,
  testId,
}: {
  eyebrow: string
  title: string
  line: string
  detail: string
  ctaLabel: string
  onClick: () => void
  visual: ReactNode
  testId: string
}) {
  return (
    <article
      data-testid={testId}
      className="group relative overflow-hidden rounded-[2.6rem] border border-cyan-100/12 bg-[#08151b] shadow-[0_34px_120px_rgba(0,0,0,0.42)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${duelStormArenaArt})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,25,30,0.85)_0%,rgba(10,25,30,0.4)_50%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(128,223,255,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_28%,rgba(0,0,0,0.24)_100%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(194,244,255,0.88),transparent)] opacity-80" />

      <div className="relative z-10 flex min-h-[30rem] flex-col justify-between p-8 sm:p-10 xl:p-9">
        <div className="max-w-[22rem]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-cyan-100/70">
            {eyebrow}
          </p>
          <h2 className="mt-5 font-display text-4xl text-white sm:text-[2.65rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-[21rem] text-base font-semibold leading-7 text-white/88">
            {line}
          </p>
          <p className="mt-4 max-w-[22rem] text-sm leading-7 text-white/72 sm:text-[0.97rem]">
            {detail}
          </p>
        </div>

        <div className="flex flex-col items-start gap-5">
          {visual}
          <button
            data-testid={`mode-cta-${testId.replace('mode-card-', '')}`}
            type="button"
            onClick={onClick}
            className="inline-flex items-center justify-center rounded-[1.5rem] border border-cyan-100/26 bg-cyan-200/10 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_0_1px_rgba(125,211,252,0.08),0_0_28px_rgba(34,211,238,0.22),0_18px_38px_rgba(0,0,0,0.26)] backdrop-blur-md transition hover:border-cyan-100/38 hover:bg-cyan-200/16"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

function DailyModeCard({
  eyebrow,
  title,
  line,
  detail,
  ctaLabel,
  onClick,
  testId,
}: {
  eyebrow: string
  title: string
  line: string
  detail: string
  ctaLabel: string
  onClick: () => void
  testId: string
}) {
  return (
    <article
      data-testid={testId}
      className="group relative overflow-hidden rounded-[2.6rem] border border-fuchsia-100/12 bg-[#190d29] shadow-[0_34px_120px_rgba(0,0,0,0.42)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${dailyEmeraldCanyonArt})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,5,35,0.9)_0%,rgba(20,5,35,0.5)_50%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_26%,rgba(0,0,0,0.22)_100%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(187,247,208,0.88),transparent)] opacity-80" />

      <div className="relative z-10 flex min-h-[30rem] flex-col justify-between p-8 sm:p-10 xl:p-9">
        <div className="max-w-[22rem]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-fuchsia-100/72">
            {eyebrow}
          </p>
          <h2 className="mt-5 font-display text-4xl text-white sm:text-[2.65rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-[21rem] text-base font-semibold leading-7 text-white/88">
            {line}
          </p>
          <p className="mt-4 max-w-[22rem] text-sm leading-7 text-white/72 sm:text-[0.97rem]">
            {detail}
          </p>
        </div>

        <div className="flex flex-col items-start gap-5">
          <button
            data-testid={`mode-cta-${testId.replace('mode-card-', '')}`}
            type="button"
            onClick={onClick}
            className="inline-flex items-center justify-center rounded-[1.5rem] border border-emerald-500 bg-emerald-400/8 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_10px_rgba(16,185,129,0.3),0_18px_38px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:bg-emerald-400/14 hover:shadow-[0_0_16px_rgba(16,185,129,0.42),0_18px_38px_rgba(0,0,0,0.28)]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

export function ModeSelectPage() {
  const navigate = useNavigate()
  const profile = useProgressStore((state) => state.profile)
  const { isAuthenticated } = useAuth()
  const dailyChallenge = getTodayDailyChallenge()
  const fallbackHero = getCurrentHeroArt('warrior', 1)
  const hero = profile ? getCurrentHeroArt(profile.classId, profile.level) : fallbackHero
  const rivalClass = profile ? getOpposingVisibleClass(profile.classId) : 'strategist'
  const rivalHero = getHeroArt(rivalClass)

  return (
    <section
      data-testid="mode-select-shell"
      className="relative min-h-screen overflow-hidden bg-[#14110d] px-4 py-6 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,188,88,0.12),_transparent_24%),radial-gradient(circle_at_right,_rgba(56,189,248,0.09),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.08),_transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-[1.9rem] border border-white/12 bg-white/[0.06] p-3 shadow-[0_18px_34px_rgba(0,0,0,0.26)] backdrop-blur-sm sm:block">
              <img
                src={brandCrest}
                alt="CheckTheAura crest"
                className="h-20 w-20 object-contain drop-shadow-[0_0_22px_rgba(255,210,120,0.28)]"
              />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-white/54">
                Режимы боя
              </p>
              <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl lg:text-6xl">
                Выбери арену
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Один экран, три пути: прокачка против AI, дуэль по комнате и ежедневное особое поле.
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/14"
          >
            Назад в лобби
          </Link>
        </div>

        <div className="mt-8 grid flex-1 gap-5 xl:grid-cols-[1.02fr_0.96fr_0.92fr]">
          <TrainingModeCard
            testId="mode-card-training"
            eyebrow="Основной режим"
            title="Тренировка"
            line="Бой против AI, XP и честный Coach."
            detail="Главный путь для роста героя, ежедневных квестов и тактического ритма."
            ctaLabel={profile ? 'НАЧАТЬ БОЙ' : 'ВЫБРАТЬ КЛАСС'}
            onClick={() => navigate(profile ? '/versus' : '/class-select')}
          />

          <DuelModeCard
            testId="mode-card-friend"
            eyebrow={isAuthenticated ? 'Сетевая дуэль' : 'Облачный режим'}
            title="Дуэль с другом"
            line="Комната, код и живая партия 1v1."
            detail="Создай комнату, отправь приглашение и играй в реальном времени на арене с мгновенным входом в бой."
            ctaLabel={isAuthenticated ? 'ОТКРЫТЬ КОМНАТУ' : 'ВОЙТИ В ОБЛАКО'}
            onClick={() => navigate(isAuthenticated ? '/play/friend' : '/auth?next=/play/friend')}
            visual={<DuelVisual hostAvatar={hero.avatar} rivalAvatar={rivalHero.fullAvatar} />}
          />

          <DailyModeCard
            testId="mode-card-daily"
            eyebrow="Ограниченный забег"
            title="Испытание дня"
            line={dailyChallenge.title}
            detail={`${dailyChallenge.goal} • ${dailyChallenge.difficulty.toUpperCase()} AI.`}
            ctaLabel={profile ? 'ОТКРЫТЬ ИСПЫТАНИЕ' : 'ВЫБРАТЬ КЛАСС'}
            onClick={() => navigate(profile ? '/play/daily' : '/class-select')}
          />
        </div>
      </div>
    </section>
  )
}
