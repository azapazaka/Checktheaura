import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getTodayDailyChallenge } from '../play/daily-challenges'
import { getCurrentHeroArt, getHeroArt, getOpposingVisibleClass } from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

function ModeOrb({
  tone,
  children,
}: {
  tone: 'training' | 'friend' | 'daily'
  children: ReactNode
}) {
  const background =
    tone === 'training'
      ? 'radial-gradient(circle at 50% 35%, rgba(251, 191, 36, 0.42), rgba(249, 115, 22, 0.18) 42%, transparent 72%)'
      : tone === 'friend'
        ? 'radial-gradient(circle at 50% 35%, rgba(52, 211, 153, 0.34), rgba(56, 189, 248, 0.16) 42%, transparent 72%)'
        : 'radial-gradient(circle at 50% 35%, rgba(196, 181, 253, 0.38), rgba(217, 70, 239, 0.18) 42%, transparent 72%)'

  return (
    <div
      className="relative mx-auto grid h-44 w-44 place-items-center rounded-full"
      style={{ background }}
    >
      <div className="absolute inset-4 rounded-full border border-white/10 bg-black/12" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function TrainingVisual({ portraitSrc }: { portraitSrc: string }) {
  return (
    <ModeOrb tone="training">
      <div className="relative h-[8.5rem] w-[8.5rem] rounded-[2rem] border border-white/10 bg-black/18 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <img
          src={portraitSrc}
          alt="Training mode hero"
          className="h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.3)]"
        />
      </div>
    </ModeOrb>
  )
}

function FriendVisual({
  hostAvatar,
  rivalAvatar,
}: {
  hostAvatar: string
  rivalAvatar: string
}) {
  return (
    <ModeOrb tone="friend">
      <div className="relative flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[1.6rem] border border-emerald-200/20 bg-black/18 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <img src={hostAvatar} alt="Host avatar" className="h-full w-full object-contain" />
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-white/8 text-xs font-black uppercase tracking-[0.24em] text-white/74">
          VS
        </div>
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[1.6rem] border border-cyan-200/20 bg-black/18 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <img src={rivalAvatar} alt="Rival avatar" className="h-full w-full object-contain" />
        </div>
      </div>
    </ModeOrb>
  )
}

function DailyVisual({ rewardXp }: { rewardXp: number }) {
  return (
    <ModeOrb tone="daily">
      <div className="relative flex h-[8.5rem] w-[8.5rem] items-center justify-center rounded-[2rem] border border-white/10 bg-black/18 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <div className="absolute inset-5 rounded-[1.5rem] border border-fuchsia-200/20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_45%)]" />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-amber-200/24 bg-amber-300/16 text-lg text-amber-100">
            ✦
          </div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/56">
            Today only
          </p>
          <p className="mt-2 text-2xl font-black text-white">+{rewardXp}</p>
        </div>
      </div>
    </ModeOrb>
  )
}

function ModeCard({
  title,
  line,
  detail,
  accentClass,
  eyebrow,
  ctaLabel,
  onClick,
  visual,
  testId,
}: {
  title: string
  line: string
  detail: string
  accentClass: string
  eyebrow: string
  ctaLabel: string
  onClick: () => void
  visual: ReactNode
  testId: string
}) {
  return (
    <article
      data-testid={testId}
      className={[
        'relative overflow-hidden rounded-[2.4rem] border border-white/10 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.3)]',
        accentClass,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_38%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white/56">
          {eyebrow}
        </p>
        <div className="mt-5">{visual}</div>
        <h2 className="mt-6 font-display text-3xl text-white">{title}</h2>
        <p className="mt-3 text-sm font-semibold text-white/84">{line}</p>
        <p className="mt-2 text-sm leading-6 text-white/62">{detail}</p>
        <button
          data-testid={`mode-cta-${testId.replace('mode-card-', '')}`}
          type="button"
          onClick={onClick}
          className="mt-6 inline-flex items-center justify-center self-start rounded-[1.4rem] border border-white/14 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/16"
        >
          {ctaLabel}
        </button>
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
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-white/54">
              Play modes
            </p>
            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl lg:text-6xl">
              Выбери арену
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              Один экран, три пути: прокачка против AI, дуэль по комнате и
              ежедневное особое поле.
            </p>
          </div>

          <Link
            to="/"
            className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/14"
          >
            Back to lobby
          </Link>
        </div>

        <div className="mt-8 grid flex-1 gap-5 xl:grid-cols-[1.02fr_0.96fr_0.92fr]">
          <ModeCard
            testId="mode-card-training"
            eyebrow="Core mode"
            title="Тренировка"
            line="AI battle, XP и честный Coach."
            detail="Главный путь для роста героя, ежедневных квестов и тактического ритма."
            accentClass="bg-[linear-gradient(180deg,rgba(82,48,12,0.84),rgba(28,21,17,0.96))]"
            ctaLabel={profile ? 'Начать бой' : 'Выбрать класс'}
            onClick={() => navigate(profile ? '/versus' : '/class-select')}
            visual={<TrainingVisual portraitSrc={hero.portrait} />}
          />

          <ModeCard
            testId="mode-card-friend"
            eyebrow={isAuthenticated ? 'Social duel' : 'Cloud mode'}
            title="Дуэль с другом"
            line="Комната, код и живая партия 1v1."
            detail="Создай room, отправь invite и играй в real-time без шума на главном лобби."
            accentClass="bg-[linear-gradient(180deg,rgba(8,48,46,0.9),rgba(17,24,32,0.96))]"
            ctaLabel={isAuthenticated ? 'Открыть room' : 'Войти в облако'}
            onClick={() => navigate(isAuthenticated ? '/play/friend' : '/auth?next=/play/friend')}
            visual={
              <FriendVisual hostAvatar={hero.avatar} rivalAvatar={rivalHero.fullAvatar} />
            }
          />

          <ModeCard
            testId="mode-card-daily"
            eyebrow="Limited run"
            title="Испытание дня"
            line={dailyChallenge.title}
            detail={`${dailyChallenge.goal} • ${dailyChallenge.difficulty.toUpperCase()} AI.`}
            accentClass="bg-[linear-gradient(180deg,rgba(46,23,77,0.92),rgba(18,18,34,0.96))]"
            ctaLabel={profile ? 'Открыть challenge' : 'Выбрать класс'}
            onClick={() => navigate(profile ? '/play/daily' : '/class-select')}
            visual={<DailyVisual rewardXp={dailyChallenge.rewardXp} />}
          />
        </div>
      </div>
    </section>
  )
}
