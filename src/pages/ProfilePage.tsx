import { useEffect, useState } from 'react'
import { Link, useInRouterContext } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchCoachHistory } from '../cloud/profile-service'
import type { CoachAnalysisRecord } from '../cloud/types'
import {
  CLASS_META,
  DAILY_QUEST_DESCRIPTIONS,
  DAILY_QUEST_LABELS,
  getCurrentHeroArt,
  getHeroArt,
} from '../rpg/meta'
import { getCurrentDailyQuests, getLevelProgress } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'

const growthTracks = {
  str: {
    label: 'Strength Track',
    description: 'Pressure, captures and warrior-style momentum.',
    gradient: 'from-rose-500 to-orange-400',
  },
  int: {
    label: 'Insight Track',
    description: 'Board reading and long tactical structure.',
    gradient: 'from-sky-400 to-blue-500',
  },
  agi: {
    label: 'Tempo Track',
    description: 'Fast transitions, initiative and clean chains.',
    gradient: 'from-emerald-400 to-cyan-400',
  },
  lck: {
    label: 'Aura Track',
    description: 'Confidence, streaks and late-match composure.',
    gradient: 'from-violet-400 to-fuchsia-500',
  },
} as const

export function ProfilePage() {
  const profile = useProgressStore((state) => state.profile)
  const inRouter = useInRouterContext()
  const { cloudProfile, isAuthenticated, user } = useAuth()
  const [coachHistory, setCoachHistory] = useState<CoachAnalysisRecord[]>([])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCoachHistory([])
      return
    }

    void fetchCoachHistory(user.id)
      .then((data) => {
        setCoachHistory(data)
      })
      .catch(() => {
        setCoachHistory([])
      })
  }, [isAuthenticated, user])

  if (!profile) {
    return (
      <section className="arcade-panel rounded-[2.5rem] p-8">
        <h2 className="font-display text-4xl text-white">Profile is not ready yet</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
          Сначала выбери класс, чтобы открыть progression-профиль, историю матчей
          и рост своего героя.
        </p>
      </section>
    )
  }

  const classMeta = CLASS_META[profile.classId]
  const hero = getCurrentHeroArt(profile.classId, profile.level)
  const heroFull = getHeroArt(profile.classId).full
  const dailyQuests = getCurrentDailyQuests(profile.dailyQuests)
  const levelProgress = getLevelProgress(profile.xp)
  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0

  return (
    <div
      data-testid="profile-progression-shell"
      className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]"
    >
      <section className="arcade-panel overflow-hidden rounded-[2.5rem] p-6 sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="arcade-kicker">Hero profile</p>
              <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
                {profile.title}
              </h2>
              <p className="mt-2 text-base text-white/72">
                {classMeta.title} • Lv. {profile.level}
              </p>
            </div>
            {inRouter ? (
              <Link
                to="/"
                className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/86"
              >
                Back to lobby
              </Link>
            ) : (
              <span className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/86">
                Back to lobby
              </span>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/14 bg-black/18 p-4">
              <div className="grid grid-cols-[5.25rem_1fr] items-center gap-4">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[1.4rem] border border-white/14 bg-white/8">
                  <img
                    src={hero.avatar}
                    alt="Profile hero avatar"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{classMeta.title}</p>
                  <p className="mt-1 text-sm text-white/64">
                    {hero.stage === 'full' ? 'Elite form active' : 'Base form evolving'}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/24">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffe45e,#ff8c42)]"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-white/68">
                {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/78">
                <strong className="block text-white">Develop your hero</strong>
                <span className="mt-2 block">
                  Attributes activate in phase 2. Пока эти треки показывают
                  направление роста, а не раздачу пустых очков в никуда.
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,rgba(8,12,32,0.86),rgba(17,22,54,0.78))] p-4">
              <div className="absolute inset-x-[12%] bottom-6 h-10 rounded-full bg-[radial-gradient(circle,_rgba(255,194,76,0.36),_rgba(255,194,76,0.04)_70%)] blur-[10px]" />
              <div className="grid gap-4 md:grid-cols-2 md:items-end">
                <div className="rounded-[1.5rem] border border-white/12 bg-black/18 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                    Current form
                  </p>
                  <img
                    src={hero.portrait}
                    alt="Current hero portrait"
                    className="mx-auto h-56 w-full object-contain"
                  />
                </div>
                <div className="rounded-[1.5rem] border border-white/12 bg-black/18 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                    Elite target
                  </p>
                  <img
                    src={heroFull}
                    alt="Elite hero portrait"
                    className="mx-auto h-56 w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Rank', profile.rankScore ?? profile.level],
              ['Win Games', profile.wins],
              ['Games', profile.gamesPlayed],
              ['Win Rate', `${winRate}%`],
              ['City', cloudProfile?.city ?? profile.city ?? 'Guest'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-white/58">{label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Growth Tracks</h3>
          <div className="mt-5 grid gap-3">
            {Object.entries(profile.stats).map(([key, value], index) => {
              const track = growthTracks[key as keyof typeof growthTracks]
              const fill = Math.min(100, 22 + value * 14 + index * 10)

              return (
                <div
                  key={key}
                  className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{track.label}</p>
                    <span className="text-sm text-white/64">{value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {track.description}
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/24">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${track.gradient}`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Daily Quests</h3>
          <div className="mt-5 grid gap-3">
            {Object.entries(dailyQuests.completed).map(([key, completed]) => (
              <div
                key={key}
                className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {DAILY_QUEST_LABELS[key as keyof typeof dailyQuests.completed]}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/66">
                      {DAILY_QUEST_DESCRIPTIONS[key as keyof typeof dailyQuests.completed]}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                      completed
                        ? 'bg-emerald-400/18 text-emerald-100'
                        : 'border border-white/14 text-white/66',
                    ].join(' ')}
                  >
                    {completed ? 'Done' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Recent Matches</h3>
          <div className="mt-5 space-y-3">
            {profile.history.length === 0 ? (
              <p className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/68">
                Сыграй первую тренировку, чтобы история матчей и growth-моменты
                появились здесь.
              </p>
            ) : (
              profile.history.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {match.outcome === 'win'
                        ? 'Победа'
                        : match.outcome === 'draw'
                          ? 'Ничья'
                          : 'Поражение'}
                    </p>
                    <p className="mt-1 text-sm text-white/62">
                      {match.difficulty.toUpperCase()} •{' '}
                      {new Date(match.playedAt).toLocaleString('ru-RU')}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/52">
                      Coach:{' '}
                      {match.analysisStatus === 'ready'
                        ? 'saved'
                        : match.analysisStatus === 'pending'
                          ? 'pending'
                          : match.analysisStatus === 'failed'
                            ? 'failed'
                            : 'local'}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-200">
                    +{match.xpEarned} XP
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="arcade-panel rounded-[2.5rem] p-5">
          <h3 className="font-display text-3xl text-white">Coach History</h3>
          <div className="mt-5 space-y-3">
            {!isAuthenticated ? (
              <p className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/68">
                Sign in to save AI Coach analysis and open it across devices.
              </p>
            ) : coachHistory.length === 0 ? (
              <p className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/68">
                No saved coach analysis yet. Finish a cloud match to build the library.
              </p>
            ) : (
              coachHistory.map((analysis) => (
                <div
                  key={analysis.id}
                  className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">Coach score {analysis.score}/10</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-white/52">
                      {analysis.source}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">{analysis.tip}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
