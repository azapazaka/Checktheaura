import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

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
      setStatusMessage('Check your inbox to confirm the account, then come back to continue.')
      return
    }

    setStatusMessage(
      mode === 'sign-in' ? 'Arena access granted. Redirecting...' : 'Account created. Redirecting...',
    )
  }

  if (isLoading || isAuthenticated) {
    return (
      <section className="arcade-panel rounded-[2.4rem] px-6 py-12 text-center">
        <p className="arcade-kicker">Checkpoint sync</p>
        <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Preparing your arena...
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
        <p className="arcade-kicker">Supabase Auth</p>
        <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Save your progress behind a real player login
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
          Sign in to unlock cloud saves, Kazakhstan leaderboard by city,
          friend-room multiplayer and saved AI Coach history. Guest mode still
          works for local AI runs, but cloud features need a real account.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Cloud saves', 'Profiles, match history and coach analysis are saved in Supabase.'],
            ['Leaderboard', 'Your wins and XP appear in national and city rankings.'],
            ['Friend rooms', 'Create live multiplayer rooms and keep playing from any device.'],
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
              Missing config
            </p>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Add these variables to your local env before testing the auth flow:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-slate-950/70 px-4 py-4 text-sm text-amber-50">
{`VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=`}
            </pre>
            <p className="mt-3 text-sm leading-6 text-white/66">
              Use the project URL and publishable key from your Supabase project&apos;s
              Connect dialog.
            </p>
          </div>
        ) : null}
      </article>

      <article className="arcade-panel rounded-[2.6rem] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="arcade-kicker">
              {mode === 'sign-in' ? 'Return to lobby' : 'Create account'}
            </p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              {mode === 'sign-in' ? 'Enter the arena' : 'Claim your checkpoint'}
            </h2>
          </div>
          <div className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
            {user?.email ?? 'email + password'}
          </div>
        </div>

        {searchParams.get('next') ? (
          <p className="mt-5 rounded-[1.5rem] border border-cyan-300/16 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
            Sign in to continue to your cloud route.
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
              {value === 'sign-in' ? 'Sign in' : 'Sign up'}
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
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-white/45">
            <span className="h-px flex-1 bg-white/12" />
            <span>or use email</span>
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
            <span className="text-sm font-semibold text-white/84">Password</span>
            <input
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[1.4rem] border border-white/14 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/32 focus:border-cyan-300/35"
              placeholder="At least 6 characters"
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
              ? 'Opening checkpoint...'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
      </article>
    </section>
  )
}
