import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { writeGuestImportDecision } from '../cloud/storage'
import { CLASS_META } from '../rpg/meta'

export function UpgradePage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, localGuestProfile, sessionMode } = useAuth()
  const [pendingChoice, setPendingChoice] = useState<'import' | 'fresh' | null>(null)

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?next=/upgrade" replace />
  }

  if (sessionMode === 'authenticated') {
    return <Navigate to="/" replace />
  }

  const classMeta = localGuestProfile ? CLASS_META[localGuestProfile.classId] : null

  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <p className="arcade-kicker">Upgrade to cloud</p>
        <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Локальный прогресс найден
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
          На этом устройстве уже есть гостевой герой. Теперь ты решаешь сам:
          перенести его в облако или начать новый облачный путь с чистого листа.
        </p>

        <div className="mt-6 rounded-[2rem] border border-white/12 bg-white/8 p-5">
          <p className="text-sm font-semibold text-white">Найденный прогресс</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/12 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Class</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {classMeta?.title ?? 'Not selected'}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/12 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Progress</p>
              <p className="mt-2 text-lg font-semibold text-white">
                Lv. {localGuestProfile?.level ?? 1} • {localGuestProfile?.xp ?? 0} XP
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <p className="arcade-kicker">Choose what to keep</p>
        <div className="mt-5 grid gap-4">
          <button
            type="button"
            disabled={pendingChoice !== null}
            onClick={() => {
              setPendingChoice('import')
              writeGuestImportDecision('import')
              navigate('/onboarding', { replace: true })
            }}
            className="rounded-[1.8rem] border border-emerald-300/24 bg-emerald-400/12 px-5 py-5 text-left transition hover:border-emerald-200/42"
          >
            <strong className="block text-lg text-white">Перенести локальный прогресс</strong>
            <span className="mt-2 block text-sm leading-6 text-white/72">
              Сохраним текущий класс, XP, историю матчей и дневные квесты в аккаунт.
            </span>
          </button>

          <button
            type="button"
            disabled={pendingChoice !== null}
            onClick={() => {
              setPendingChoice('fresh')
              writeGuestImportDecision('fresh')
              navigate('/onboarding', { replace: true })
            }}
            className="rounded-[1.8rem] border border-white/14 bg-white/8 px-5 py-5 text-left transition hover:border-white/26"
          >
            <strong className="block text-lg text-white">Начать новый облачный профиль</strong>
            <span className="mt-2 block text-sm leading-6 text-white/72">
              Локальный run останется на этом устройстве, а облачный аккаунт начнётся с новой
              инициализации.
            </span>
          </button>
        </div>
      </article>
    </section>
  )
}
