import { useEffect } from 'react'
import { BrowserRouter, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { getCurrentHeroArt } from './rpg/meta'
import { getLevelProgress } from './rpg/progression'
import { ClassSelectPage } from './pages/ClassSelectPage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { VersusPage } from './pages/VersusPage'
import { useProgressStore } from './store/progress-store'

function AppLayout() {
  const location = useLocation()
  const profile = useProgressStore((state) => state.profile)
  const settings = useProgressStore((state) => state.settings)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.preferredTheme
  }, [settings.preferredTheme])

  const hero = profile ? getCurrentHeroArt(profile.classId, profile.level) : null
  const levelProgress = profile ? getLevelProgress(profile.xp) : null
  const isLobbyRoute = location.pathname === '/'

  return (
    <div
      className={[
        'min-h-screen text-[color:var(--ink)]',
        isLobbyRoute
          ? 'bg-[#14110d]'
          : 'bg-[radial-gradient(circle_at_top,_rgba(255,222,89,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,76,124,0.18),_transparent_26%),linear-gradient(180deg,_var(--page-top),_var(--page-bottom))]',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto flex min-h-screen flex-col',
          isLobbyRoute
            ? 'max-w-none px-0 pb-0 pt-0'
            : 'max-w-7xl px-3 pb-6 pt-3 sm:px-5 lg:px-6',
        ].join(' ')}
      >
        {isLobbyRoute ? null : (
          <header className="arcade-panel mb-4 overflow-hidden rounded-[2rem] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-[1.4rem] border border-white/20 bg-white/10 shadow-[0_14px_28px_rgba(9,12,44,0.25)]">
                <span className="text-2xl">♞</span>
              </div>
              <div>
                <p className="arcade-kicker">Mobile Arcade Checkers RPG</p>
                <h1 data-testid="app-title" className="font-display text-3xl tracking-[0.06em] text-white sm:text-4xl">
                  CheckTheAura
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="arcade-chip min-w-[7.75rem] justify-between">
                <span className="text-lg">🪙</span>
                <span className="font-semibold text-white">150</span>
              </div>
              <div className="arcade-chip min-w-[7.75rem] justify-between">
                <span className="text-lg">⚙</span>
                <span className="font-semibold text-white">
                  {settings.preferredTheme === 'dark' ? 'Night' : 'Amber'}
                </span>
              </div>
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
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[1.2rem] border border-white/18 bg-white/6">
                  <img
                    src={hero.avatar}
                    alt="Current hero avatar"
                    className="h-full w-full object-contain"
                  />
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
                  <p className="mt-1 text-xs text-white/72">
                    {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP
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
          <Route path="/class-select" element={<ClassSelectPage />} />
          <Route path="/versus" element={<VersusPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
