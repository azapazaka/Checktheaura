import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { buildNextPath } from '../../auth/next-path'

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, isLoading, isProfileLoading } = useAuth()

  if (isLoading || isProfileLoading) {
    return (
      <section className="arcade-panel rounded-[2.4rem] px-6 py-12 text-center">
        <p className="arcade-kicker">Syncing checkpoint</p>
        <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Checking your arena access...
        </h2>
      </section>
    )
  }

  if (!isAuthenticated) {
    const next = buildNextPath(
      location.pathname,
      location.search,
      location.hash,
    )
    return <Navigate to={`/auth?next=${next}`} replace />
  }

  return <Outlet />
}
