import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_CITY, KAZAKHSTAN_CITIES } from '../cloud/cities'
import { readGuestImportDecision } from '../cloud/storage'
import { CLASS_META, getVisibleStarterClasses } from '../rpg/meta'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding, isAuthenticated, isLoading, localGuestProfile, sessionMode } =
    useAuth()
  const importDecision = readGuestImportDecision()
  const isImportFlow = importDecision === 'import'
  const starterClasses = getVisibleStarterClasses()
  const initialClassId = useMemo(
    () => (isImportFlow && localGuestProfile ? localGuestProfile.classId : starterClasses[0]),
    [isImportFlow, localGuestProfile, starterClasses],
  )
  const [classId, setClassId] = useState(initialClassId)
  const [city, setCity] = useState(localGuestProfile?.city ?? DEFAULT_CITY)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?next=/onboarding" replace />
  }

  if (sessionMode === 'authenticated') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    const result = await completeOnboarding({
      classId,
      city,
      importGuestProgress: isImportFlow,
    })

    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <p className="arcade-kicker">Cloud onboarding</p>
        <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Подготовим облачный профиль
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
          Выбери путь героя и город Казахстана, чтобы мы могли сохранить твой прогресс,
          показать локальный рейтинг и открыть friend-room multiplayer.
        </p>

        <div className="mt-6 grid gap-3">
          {starterClasses.map((value) => {
            const item = CLASS_META[value]
            const isLockedByImport = isImportFlow && localGuestProfile?.classId !== value

            return (
              <button
                key={value}
                type="button"
                disabled={isLockedByImport}
                onClick={() => setClassId(value)}
                className={[
                  'rounded-[1.8rem] border px-5 py-5 text-left transition',
                  classId === value
                    ? 'border-amber-300/40 bg-amber-400/12'
                    : 'border-white/12 bg-white/8 hover:border-white/24',
                  isLockedByImport ? 'cursor-not-allowed opacity-45' : '',
                ].join(' ')}
              >
                <strong className="block text-lg text-white">{item.title}</strong>
                <span className="mt-2 block text-sm leading-6 text-white/72">{item.activeBonus}</span>
              </button>
            )
          })}
        </div>
      </article>

      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div>
            <p className="arcade-kicker">Kazakhstan leaderboard</p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              Выбери свой город
            </h2>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-white/84">City</span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-[1.4rem] border border-white/14 bg-black/20 px-4 py-3 text-white outline-none"
            >
              {KAZAKHSTAN_CITIES.map((entry) => (
                <option key={entry} value={entry} className="text-slate-900">
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/72">
            {isImportFlow
              ? 'Импорт включён: после подтверждения локальный прогресс станет твоим облачным профилем.'
              : 'Новый облачный профиль стартует с выбранным классом и чистой историей.'}
          </div>

          {errorMessage ? (
            <p className="rounded-[1.5rem] border border-rose-300/16 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[1.6rem] bg-[linear-gradient(90deg,#ffe059,#ff8a3d)] px-4 py-3 text-base font-bold text-slate-950 shadow-[0_18px_28px_rgba(255,174,0,0.26)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating cloud profile...' : 'Finish onboarding'}
          </button>
        </form>
      </article>
    </section>
  )
}
