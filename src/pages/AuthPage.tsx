import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import brandCrest from '../assets/brand-crest.png'

type AuthMode = 'sign-in' | 'sign-up'

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) {
    return '/'
  }

  return value === '/auth' ? '/' : value
}

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    isAuthenticated,
    isConfigured,
    isLoading,
    sessionMode,
    signInWithPassword,
    signInWithGoogle,
    signUp,
    user,
  } = useAuth()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const nextPath = getSafeNextPath(searchParams.get('next'))

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(
        sessionMode === 'upgrading'
          ? '/upgrade'
          : sessionMode === 'onboarding'
            ? '/onboarding'
            : nextPath,
        { replace: true },
      )
    }
  }, [isAuthenticated, isLoading, navigate, nextPath, sessionMode])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    const result =
      mode === 'sign-in'
        ? await signInWithPassword({ email, password })
        : await signUp({ email, password })

    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    if (mode === 'sign-up' && result.needsEmailConfirmation) {
      setStatusMessage('Проверь почту, подтверди аккаунт и возвращайся в игру.')
      return
    }

    setStatusMessage(
      mode === 'sign-in' ? 'Доступ на арену открыт. Перенаправляем...' : 'Аккаунт создан. Перенаправляем...',
    )
  }

  if (isLoading || isAuthenticated) {
    return (
      <section className="arcade-panel rounded-[2.4rem] px-6 py-12 text-center">
        <p className="arcade-kicker">Синхронизация точки входа</p>
        <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Готовим твою арену...
        </h2>
      </section>
    )
  }

  return (
    <section
      data-testid="auth-shell"
      className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <article className="arcade-panel overflow-hidden rounded-[2.6rem] p-6 sm:p-8">
        <div className="mb-6 flex justify-center lg:justify-start">
          <div className="rounded-[2rem] border border-amber-200/14 bg-white/[0.06] p-3 shadow-[0_24px_46px_rgba(0,0,0,0.26)] backdrop-blur-sm">
            <img
              src={brandCrest}
              alt="CheckTheAura crest"
              className="h-24 w-24 object-contain drop-shadow-[0_0_24px_rgba(255,214,132,0.28)]"
            />
          </div>
        </div>
        <p className="arcade-kicker">Supabase Auth</p>
        <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Сохрани прогресс за настоящим входом игрока
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
          Войди, чтобы открыть облачные сохранения, лидерборд Казахстана по городам,
          friend-room мультиплеер и сохранённую историю AI Coach. Гостевой режим всё
          ещё работает для локальных боёв против AI, но облачным возможностям нужен
          настоящий аккаунт.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Облачные сохранения', 'Профили, история матчей и разбор Coach сохраняются в Supabase.'],
            ['Лидерборд', 'Твои победы и XP появляются в национальном и городском рейтинге.'],
            ['Комнаты с друзьями', 'Создавай живые мультиплеерные комнаты и продолжай игру с любого устройства.'],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-[1.8rem] border border-white/12 bg-white/8 px-4 py-4"
            >
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-white/66">{body}</p>
            </div>
          ))}
        </div>

        {!isConfigured ? (
          <div className="mt-6 rounded-[2rem] border border-amber-300/20 bg-amber-400/10 px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
              Не хватает конфигурации
            </p>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Добавь эти переменные в локальный env перед проверкой auth flow:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-slate-950/70 px-4 py-4 text-sm text-amber-50">
{`VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=`}
            </pre>
            <p className="mt-3 text-sm leading-6 text-white/66">
              Возьми project URL и publishable key из Connect dialog своего проекта Supabase.
            </p>
          </div>
        ) : null}
      </article>

      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="arcade-kicker">
              {mode === 'sign-in' ? 'Возвращение в лобби' : 'Создание аккаунта'}
            </p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              {mode === 'sign-in' ? 'Войти на арену' : 'Закрепить чекпоинт'}
            </h2>
          </div>
          <div className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
            {user?.email ?? 'email + password'}
          </div>
        </div>

        {searchParams.get('next') ? (
          <p className="mt-5 rounded-[1.5rem] border border-cyan-300/16 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
            Войди, чтобы продолжить путь по облачному маршруту.
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          {(['sign-in', 'sign-up'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value)
                setErrorMessage(null)
                setStatusMessage(null)
              }}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                mode === value
                  ? 'bg-white text-slate-900'
                  : 'border border-white/14 bg-white/8 text-white/76',
              ].join(' ')}
            >
              {value === 'sign-in' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <button
            type="button"
            disabled={isSubmitting || !isConfigured}
            onClick={async () => {
              setErrorMessage(null)
              setStatusMessage(null)
              const result = await signInWithGoogle()
              if (result.error) {
                setErrorMessage(result.error)
              }
            }}
            className="rounded-[1.4rem] border border-white/14 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Продолжить через Google
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-white/45">
            <span className="h-px flex-1 bg-white/12" />
            <span>или по email</span>
            <span className="h-px flex-1 bg-white/12" />
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-white/84">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[1.4rem] border border-white/14 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/32 focus:border-cyan-300/35"
              placeholder="player@checktheaura.com"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-white/84">Пароль</span>
            <input
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[1.4rem] border border-white/14 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/32 focus:border-cyan-300/35"
              placeholder="Минимум 6 символов"
              minLength={6}
              required
            />
          </label>

          {errorMessage ? (
            <p className="rounded-[1.5rem] border border-rose-300/16 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p
              aria-live="polite"
              className="rounded-[1.5rem] border border-emerald-300/16 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50"
            >
              {statusMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="rounded-[1.6rem] bg-[linear-gradient(90deg,#ffe059,#ff8a3d)] px-4 py-3 text-base font-bold text-slate-950 shadow-[0_18px_28px_rgba(255,174,0,0.26)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Открываем чекпоинт...'
              : mode === 'sign-in'
                ? 'Войти'
                : 'Создать аккаунт'}
          </button>
        </form>
      </article>
    </section>
  )
}
