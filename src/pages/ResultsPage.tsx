import { startTransition, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { buildFallbackCoachAnalysis } from '../coach/fallback'
import type { CoachAnalyzeResponse } from '../coach/types'
import { persistCloudMatch, persistCoachAnalysis } from '../cloud/match-service'
import { MatchReplay } from '../components/game/MatchReplay'
import {
  CLASS_META,
  DAILY_QUEST_LABELS,
  XP_BREAKDOWN_LABELS,
  getCurrentHeroArt,
  getDifficultyLabel,
  getThemeLabel,
} from '../rpg/meta'
import { getLevelProgress } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'

type AnalysisState = {
  matchId: string
  payload: CoachAnalyzeResponse
  source: 'live' | 'fallback'
}

export function ResultsPage() {
  const lastResult = useProgressStore((state) => state.lastResult)
  const profile = useProgressStore((state) => state.profile)
  const hydrateHistory = useProgressStore((state) => state.hydrateHistory)
  const hydrateLastResult = useProgressStore((state) => state.hydrateLastResult)
  const { isAuthenticated } = useAuth()
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(null)
  const [cloudSaveStatus, setCloudSaveStatus] = useState<
    'idle' | 'saving-match' | 'saving-analysis' | 'saved' | 'failed'
  >('idle')
  const [cloudSaveError, setCloudSaveError] = useState<string | null>(null)
  const analysisSaveInFlightRef = useRef<Set<string>>(new Set())
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!lastResult) {
      return
    }

    let cancelled = false

    const fallbackPayload = buildFallbackCoachAnalysis({
      moves: lastResult.moves,
      result: lastResult.result,
      playerColor: 'white',
      difficulty: lastResult.difficulty,
      xpSummary: lastResult.xpSummary,
    })

    const loadAnalysis = async () => {
      try {
        const response = await fetch('/api/coach/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moves: lastResult.moves,
            result: lastResult.result,
            playerColor: 'white',
            difficulty: lastResult.difficulty,
            xpSummary: lastResult.xpSummary,
          }),
        })

        if (!response.ok) {
          throw new Error('Coach endpoint failed')
        }

        const payload = (await response.json()) as CoachAnalyzeResponse
        const source =
          JSON.stringify(payload) === JSON.stringify(fallbackPayload)
            ? 'fallback'
            : 'live'

        if (!cancelled) {
          startTransition(() =>
            setAnalysisState({ matchId: lastResult.id, payload, source }),
          )
        }
      } catch {
        if (!cancelled) {
          startTransition(() =>
            setAnalysisState({
              matchId: lastResult.id,
              payload: fallbackPayload,
              source: 'fallback',
            }),
          )
        }
      }
    }

    void loadAnalysis()

    return () => {
      cancelled = true
    }
  }, [lastResult])

  const analysis =
    lastResult && analysisState?.matchId === lastResult.id
      ? analysisState.payload
      : null
  const analysisSource =
    lastResult && analysisState?.matchId === lastResult.id
      ? analysisState.source
      : null
  const isLoading = !analysis

  useEffect(() => {
    if (!isAuthenticated || !lastResult || !profile || lastResult.matchId) {
      return
    }

    let cancelled = false

    const persist = async () => {
      setCloudSaveStatus('saving-match')
      setCloudSaveError(null)

      try {
        const { match } = await persistCloudMatch({
          latestResult: lastResult,
          profile,
        })

        if (cancelled) {
          return
        }

        const updatedResult = {
          ...lastResult,
          matchId: match.matchId,
          analysisStatus: 'pending' as const,
        }

        hydrateLastResult(updatedResult)
        hydrateHistory(
          profile.history.map((entry, index) =>
            index === 0 && entry.id === lastResult.id
              ? { ...entry, matchId: match.matchId, analysisStatus: 'pending' }
              : entry,
          ),
        )
        setCloudSaveStatus('saving-analysis')
      } catch (error) {
        if (!cancelled) {
          setCloudSaveError(
            error instanceof Error ? error.message : 'Не удалось сохранить матч.',
          )
          setCloudSaveStatus('failed')
        }
      }
    }

    void persist()

    return () => {
      cancelled = true
    }
  }, [hydrateHistory, hydrateLastResult, isAuthenticated, lastResult, profile])

  useEffect(() => {
    if (
      !isAuthenticated ||
      !lastResult ||
      !profile ||
      !lastResult.matchId ||
      !analysis ||
      lastResult.coachAnalysisId
    ) {
      return
    }

    const matchId = lastResult.matchId
    const resultId = lastResult.id

    if (analysisSaveInFlightRef.current.has(matchId)) {
      return
    }

    analysisSaveInFlightRef.current.add(matchId)

    const saveAnalysis = async () => {
      try {
        const { analysis: savedAnalysis } = await persistCoachAnalysis({
          matchId,
          analysis,
          source: analysisSource ?? 'fallback',
          status: 'ready',
        })

        if (!isMountedRef.current) {
          return
        }

        const store = useProgressStore.getState()
        const currentLastResult = store.lastResult
        const currentProfile = store.profile
        const isSameResult = currentLastResult?.id === resultId

        if (isSameResult && currentLastResult) {
          hydrateLastResult({
            ...currentLastResult,
            coachAnalysisId: savedAnalysis.id,
            analysisStatus: savedAnalysis.status,
          })
        }

        if (currentProfile) {
          hydrateHistory(
            currentProfile.history.map((entry) =>
              entry.id === resultId
                ? {
                    ...entry,
                    coachAnalysisId: savedAnalysis.id,
                    analysisStatus: savedAnalysis.status,
                  }
                : entry,
            ),
          )
        }

        if (isSameResult) {
          setCloudSaveStatus('saved')
        }
      } catch (error) {
        analysisSaveInFlightRef.current.delete(matchId)

        if (isMountedRef.current && useProgressStore.getState().lastResult?.id === resultId) {
          setCloudSaveError(
            error instanceof Error
              ? error.message
              : 'Не удалось сохранить разбор Coach.',
          )
          setCloudSaveStatus('failed')
        }
      }
    }

    void saveAnalysis()
  }, [
    analysis,
    analysisSource,
    hydrateHistory,
    hydrateLastResult,
    isAuthenticated,
    lastResult,
    profile,
  ])

  if (!lastResult || !profile) {
    return (
      <section className="arcade-panel rounded-[2.5rem] p-8">
        <h2 className="font-display text-4xl text-white">Пока нет завершённой партии</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
          Когда закончишь матч, здесь появятся XP-сводка, свежие открытия и честный
          разбор от AI Coach.
        </p>
      </section>
    )
  }

  const levelProgress = getLevelProgress(profile.xp)
  const classMeta = CLASS_META[profile.classId]
  const hero = getCurrentHeroArt(profile.classId, profile.level)
  const unlockEntries = [
    ...lastResult.newUnlocks.difficulties.map(getDifficultyLabel),
    ...lastResult.newUnlocks.themes.map(getThemeLabel),
  ]
  const questRewardEntries = Object.entries(lastResult.dailyQuestRewards).filter(
    ([, value]) => value > 0,
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
      <section className="arcade-panel overflow-hidden rounded-[2.5rem] p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="arcade-kicker">Матч завершён</p>
            <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              {lastResult.outcome === 'win'
                ? 'Победа'
                : lastResult.outcome === 'draw'
                  ? 'Ничья'
                  : 'Поражение'}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/72">
              Матч завершён, герой получил опыт, а progression честно отражает XP,
              ежедневные награды и свежие открытия после партии.
            </p>
          </div>
          <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[2rem] border border-white/14 bg-white/8">
            <img src={hero.avatar} alt="Аватар героя результата" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">Получено XP</p>
            <p className="mt-2 text-4xl font-bold text-white">+{lastResult.xpEarned}</p>
          </div>
          <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">Новый уровень</p>
            <p className="mt-2 text-4xl font-bold text-white">{profile.level}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.9rem] border border-white/12 bg-black/18 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                Прогресс до следующего уровня
              </p>
              <p className="mt-2 text-sm text-white/66">
                {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP • следующий уровень{' '}
                {levelProgress.nextLevel}
              </p>
            </div>
            <p className="text-2xl font-bold text-white">{levelProgress.progressPercent}%</p>
          </div>
          <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/24">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ffe45e,#ff8c42)]"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {Object.entries(lastResult.xpSummary.breakdown).map(([label, value]) =>
            value > 0 ? (
              <div
                key={label}
                className="flex items-center justify-between rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4 text-sm"
              >
                <span className="text-white/78">
                  {XP_BREAKDOWN_LABELS[label as keyof typeof lastResult.xpSummary.breakdown]}
                </span>
                <span className="font-bold text-white">+{value}</span>
              </div>
            ) : null,
          )}
        </div>

        {questRewardEntries.length > 0 ? (
          <div className="mt-5 rounded-[1.8rem] border border-emerald-300/18 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/72">
              Квесты дня закрыты этим матчем
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {questRewardEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-emerald-50">
                  <span>{DAILY_QUEST_LABELS[key as keyof typeof lastResult.dailyQuestRewards]}</span>
                  <span className="font-bold">+{value} XP</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {unlockEntries.length > 0 ? (
          <div className="mt-5 rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">
              Новые разблокировки
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {unlockEntries.map((unlock) => (
                <span
                  key={unlock}
                  className="rounded-full bg-[linear-gradient(90deg,#56ccf2,#2f80ed)] px-3 py-2 text-sm font-bold text-white"
                >
                  {unlock}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-[1.8rem] border border-white/12 bg-black/18 p-4 text-sm leading-6 text-white/74">
          <p className="font-semibold text-white">{classMeta.activeBonus}</p>
          <p className="mt-2">
            {lastResult.usedShadowHint
              ? 'Матч сыгран с подсказкой Shadow.'
              : 'Матч сыгран без подсказки Shadow.'}
          </p>
        </div>

        {isAuthenticated ? (
          <div className="mt-5 rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/72">
            Статус облачного сохранения:{' '}
            <strong className="text-white">
              {cloudSaveStatus === 'idle'
                ? 'ожидание'
                : cloudSaveStatus === 'saving-match'
                  ? 'сохраняем матч'
                  : cloudSaveStatus === 'saving-analysis'
                    ? 'сохраняем разбор'
                    : cloudSaveStatus === 'saved'
                      ? 'сохранено'
                      : 'ошибка'}
            </strong>
            {cloudSaveError ? (
              <p className="mt-2 text-xs leading-6 text-rose-200/84">{cloudSaveError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/versus"
            className="rounded-[1.4rem] bg-[linear-gradient(90deg,#ffd54f,#ff9f1c)] px-5 py-3 text-sm font-bold text-slate-950"
          >
            Сыграть ещё раз
          </Link>
          <Link
            to="/profile"
            className="rounded-[1.4rem] border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white/84"
          >
            Открыть профиль
          </Link>
        </div>
      </section>

      <section className="arcade-panel rounded-[2.5rem] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="arcade-kicker">AI Coach</p>
            <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
              Разбор партии
            </h2>
          </div>
          {analysisSource ? (
            <span
              className={[
                'rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em]',
                analysisSource === 'live'
                  ? 'bg-emerald-400/16 text-emerald-100'
                  : 'border border-white/12 text-white/68',
              ].join(' ')}
            >
              {analysisSource === 'live' ? 'Живой Coach' : 'Резервный Coach'}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm leading-7 text-white/68">
            Анализируем ключевые моменты партии и поднимаем честную обратную связь по
            твоей структуре игры...
          </p>
        ) : null}

        {analysis ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                Оценка партии
              </p>
              <p className="mt-2 text-5xl font-bold text-white">{analysis.score}/10</p>
            </div>

            <div>
              <h3 className="font-display text-3xl text-white">Сильные моменты</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/72">
                {analysis.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-3xl text-white">Визуальный разбор ошибок</h3>
              <p className="mb-4 mt-2 text-sm text-white/60">
                Интерактивный плеер для просмотра лучших ходов по мнению тренера.
              </p>
              <div className="flex justify-center rounded-[1.5rem] border border-white/12 bg-black/40 p-4 sm:p-6">
                <MatchReplay
                  moveLog={lastResult.moves}
                  mistakes={analysis.mistakes}
                  playerClass={profile.classId}
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#2f80ed,#56ccf2)] px-5 py-5 text-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-68">
                Практический совет
              </p>
              <p className="mt-2 text-sm leading-7">{analysis.tip}</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
