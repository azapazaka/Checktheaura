import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { ClassSelectPage } from './pages/ClassSelectPage'
import { DailyChallengePage } from './pages/DailyChallengePage'
import { FriendModePage } from './pages/FriendModePage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { ModeSelectPage } from './pages/ModeSelectPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { RoomPage } from './pages/RoomPage'
import { UpgradePage } from './pages/UpgradePage'
import { VersusPage } from './pages/VersusPage'
import { getCurrentHeroArt } from './rpg/meta'
import { getLevelProgress } from './rpg/progression'
import { useProgressStore } from './store/progress-store'

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedProfile = useProgressStore((state) => state.profile)
  const settings = useProgressStore((state) => state.settings)
  const { isAuthenticated, signOut, user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.preferredTheme
  }, [settings.preferredTheme])

  const profile = isAuthenticated ? storedProfile : null
  const hero = profile ? getCurrentHeroArt(profile.classId, profile.level) : null
  const levelProgress = profile ? getLevelProgress(profile.xp) : null
  const isLobbyRoute = location.pathname === '/'
  const isPlayRoute = location.pathname === '/play' || location.pathname.startsWith('/play/')
  const isImmersiveRoute = isLobbyRoute || isPlayRoute
  const hideHeader =
    isImmersiveRoute ||
    location.pathname === '/auth' ||
    location.pathname === '/onboarding' ||
    location.pathname === '/upgrade'

  async function handleSignOut() {
    setIsSigningOut(true)
    const result = await signOut()
    setIsSigningOut(false)

    if (!result.error) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      className={[
        'min-h-screen text-[color:var(--ink)]',
        isImmersiveRoute
          ? 'bg-[#14110d]'
          : 'bg-[radial-gradient(circle_at_top,_rgba(255,222,89,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,76,124,0.18),_transparent_26%),linear-gradient(180deg,_var(--page-top),_var(--page-bottom))]',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto flex min-h-screen flex-col',
          isImmersiveRoute
            ? 'max-w-none px-0 pb-0 pt-0'
            : 'max-w-7xl px-3 pb-6 pt-3 sm:px-5 lg:px-6',
        ].join(' ')}
      >
        {hideHeader ? null : (
          <header className="arcade-panel mb-4 overflow-hidden rounded-[2rem] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[1.4rem] border border-white/20 bg-white/10 shadow-[0_14px_28px_rgba(9,12,44,0.25)]">
                  <span className="text-2xl">♞</span>
                </div>
                <div>
                  <p className="arcade-kicker">Mobile Arcade Checkers RPG</p>
                  <h1
                    data-testid="app-title"
                    className="font-display text-3xl tracking-[0.06em] text-white sm:text-4xl"
                  >
                    CheckTheAura
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="arcade-chip min-w-[7.75rem] justify-between">
                  <span className="text-lg">🪙</span>
                  <span className="font-semibold text-white">150</span>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                    className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                ) : (
                  <div className="arcade-chip min-w-[7.75rem] justify-between">
                    <span className="text-lg">⚙</span>
                    <span className="font-semibold text-white">
                      {settings.preferredTheme === 'dark' ? 'Night' : 'Amber'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <nav className="flex flex-wrap gap-2">
                {[
                  ['/', 'Lobby'],
                  ['/class-select', 'Classes'],
                  ['/profile', 'Profile'],
                  ['/results', 'Results'],
                ].map(([to, label]) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                        isActive
                          ? 'bg-white text-slate-900 shadow-[0_10px_24px_rgba(255,255,255,0.22)]'
                          : 'border border-white/18 bg-white/8 text-white/88 hover:bg-white/14',
                      ].join(' ')
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              {profile && hero && levelProgress ? (
                <div className="flex min-w-[18rem] items-center gap-3 rounded-[1.5rem] border border-white/16 bg-slate-950/22 px-3 py-3">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[1.2rem] border border-white/18 bg-white/6 relative">
                    <img
                      src={hero.avatar}
                      alt="Current hero avatar"
                      className="h-full w-full object-contain"
                    />
                    {(profile as unknown as { is_pro?: boolean }).is_pro && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase text-slate-900 shadow-md">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {profile.title} • Lv. {profile.level}
                      </p>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-white/78">
                        {profile.classId}
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/25">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#ffe059,#ff7f50)] transition-[width]"
                        style={{ width: `${levelProgress.progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 flex items-center justify-between text-xs text-white/72">
                      <span>
                        {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP
                      </span>
                      {!(profile as unknown as { is_pro?: boolean }).is_pro && (
                        <NavLink to="/pricing" className="text-yellow-400 hover:underline">
                          Go PRO ✦
                        </NavLink>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/16 px-4 py-3 text-sm text-white/72">
                  Выбери класс, чтобы открыть свой arcade-путь.
                </div>
              )}
            </div>
          </header>
        )}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<ModeSelectPage />} />
          <Route path="/play/friend" element={<FriendModePage />} />
          <Route path="/play/daily" element={<DailyChallengePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/class-select" element={<ClassSelectPage />} />
          <Route path="/versus" element={<VersusPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/rooms/:roomCode" element={<RoomPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
