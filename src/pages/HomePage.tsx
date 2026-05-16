import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import schoolBagIcon from '../assets/lobby-icons/school-bag.png'
import shoppingCartIcon from '../assets/lobby-icons/shopping-cart.png'
import trophyStarIcon from '../assets/lobby-icons/trophy-star.png'
import { fetchLeaderboard } from '../cloud/leaderboard-service'
import { createRoom } from '../cloud/room-service'
import type { LeaderboardEntry } from '../cloud/types'
import { LobbyStage } from '../components/lobby/LobbyStage'
import { DAILY_QUEST_LABELS, getCurrentHeroArt } from '../rpg/meta'
import { getCurrentDailyQuests, getLevelProgress } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'

type LobbyOverlay = null | 'leaderboard' | 'skins' | 'shop'
type RegionTab = 'all' | 'Алматы' | 'Астана' | 'Шымкент' | 'Актау'

const REGION_TABS: Array<{ id: RegionTab; label: string }> = [
  { id: 'all', label: 'All KZ' },
  { id: 'Алматы', label: 'Алматы' },
  { id: 'Астана', label: 'Астана' },
  { id: 'Шымкент', label: 'Шымкент' },
  { id: 'Актау', label: 'Актау' },
]

const SKIN_CARDS = [
  { name: 'Nomad', status: 'Equip', locked: false },
  { name: 'Khan', status: 'Active', locked: false },
  { name: 'Shadow', status: 'Level 15', locked: true },
  { name: 'Phantom', status: 'PRO', locked: true },
]

const SHOP_SKINS = [
  { name: 'Steppe Khan', price: '180 coins' },
  { name: 'Steel Batyr', price: '220 coins' },
]

const SHOP_THEMES = [
  { name: 'Kazakh Ornament', price: '120 coins' },
  { name: 'Night Gorge', price: '160 coins' },
]

const AURA_META: Record<string, { label: string; className: string }> = {
  warrior: { label: 'Berserk', className: 'lobby-aura-pill--berserk' },
  strategist: { label: 'Tactician', className: 'lobby-aura-pill--tactician' },
  shadow: { label: 'Shadow', className: 'lobby-aura-pill--shadow' },
  fallback: { label: 'Rookie', className: 'lobby-aura-pill--rookie' },
}

function copyTextSafely(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return
  }

  void navigator.clipboard.writeText(value)
}

function shareInviteSafely(inviteUrl: string) {
  if (typeof navigator === 'undefined') {
    return
  }

  if (navigator.share) {
    void navigator.share({
      title: 'CheckTheAura room',
      url: inviteUrl,
    })
    return
  }

  copyTextSafely(inviteUrl)
}

function getQuestWidget(profile: ReturnType<typeof useProgressStore.getState>['profile']) {
  if (!profile) {
    return {
      title: 'Beat Medium AI',
      progressPercent: 33,
    }
  }

  const quests = getCurrentDailyQuests(profile.dailyQuests)
  const completedCount = Object.values(quests.completed).filter(Boolean).length
  const activeEntry = Object.entries(quests.completed).find(([, completed]) => !completed)

  if (!activeEntry) {
    return {
      title: 'Daily quests complete',
      progressPercent: 100,
    }
  }

  return {
    title: DAILY_QUEST_LABELS[activeEntry[0] as keyof typeof DAILY_QUEST_LABELS],
    progressPercent: Math.max(20, Math.round((completedCount / 3) * 100)),
  }
}

function StageActionButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button type="button" aria-label={label} className="lobby-side-action" onClick={onClick}>
      <img src={icon} alt="" className="lobby-side-action__icon" />
    </button>
  )
}

function RoomActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="lobby-room-action">
      {children}
    </button>
  )
}

function LobbyOverlayModal({
  activeOverlay,
  onClose,
  canLoadLeaderboard,
  leaderboardEntries,
  leaderboardLoading,
  leaderboardError,
  onLeaderboardScopeChange,
}: {
  activeOverlay: LobbyOverlay
  onClose: () => void
  canLoadLeaderboard: boolean
  leaderboardEntries: LeaderboardEntry[]
  leaderboardLoading: boolean
  leaderboardError: string | null
  onLeaderboardScopeChange: (scope: RegionTab) => void
}) {
  const [regionTab, setRegionTab] = useState<RegionTab>('Актау')

  useEffect(() => {
    if (activeOverlay === 'leaderboard') {
      onLeaderboardScopeChange(regionTab)
    }
  }, [activeOverlay, onLeaderboardScopeChange, regionTab])

  const podiumEntries = leaderboardEntries.slice(0, 3)
  const listEntries = leaderboardEntries.slice(3)

  return (
    <AnimatePresence>
      {activeOverlay ? (
        <motion.div
          key={activeOverlay}
          className="lobby-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="lobby-modal-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close overlay"
              className="lobby-modal-close"
              onClick={onClose}
            >
              x
            </button>

            {activeOverlay === 'leaderboard' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">Kazakhstan Leaderboard</div>
                <div className="lobby-region-tabs">
                  {REGION_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={[
                        'lobby-region-tab',
                        tab.id === regionTab ? 'lobby-region-tab--active' : '',
                      ].join(' ')}
                      onClick={() => setRegionTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {!canLoadLeaderboard ? (
                  <p className="lobby-modal-footnote">
                    Sign in to open the real city leaderboard.
                  </p>
                ) : leaderboardLoading ? (
                  <p className="lobby-modal-footnote">Loading live leaderboard...</p>
                ) : leaderboardError ? (
                  <p className="lobby-modal-footnote">{leaderboardError}</p>
                ) : (
                  <>
                    <div className="lobby-podium-grid">
                      {podiumEntries.map((entry) => (
                        <article key={entry.rank} className="lobby-podium-card">
                          <span className="lobby-podium-card__medal">#{entry.rank}</span>
                          <strong>{entry.title}</strong>
                          <span>{entry.rankScore} aura</span>
                        </article>
                      ))}
                    </div>
                    <div className="lobby-leaderboard-list">
                      {listEntries.map((entry) => (
                        <div key={entry.rank} className="lobby-list-row">
                          <span>#{entry.rank}</span>
                          <strong>
                            {entry.title}
                            {entry.isCurrentUser ? ' • you' : ''}
                          </strong>
                          <span>{entry.rankScore}</span>
                        </div>
                      ))}
                    </div>
                    <p className="lobby-modal-footnote">
                      Live ranking for {regionTab === 'all' ? 'all Kazakhstan' : regionTab}.
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {activeOverlay === 'skins' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">My Skins</div>
                <div className="lobby-card-grid">
                  {SKIN_CARDS.map((skin) => (
                    <article key={skin.name} className="lobby-skin-card">
                      <span className="lobby-skin-card__title">{skin.name}</span>
                      <span
                        className={[
                          'lobby-skin-card__status',
                          skin.locked ? 'is-locked' : 'is-active',
                        ].join(' ')}
                      >
                        {skin.status}
                      </span>
                    </article>
                  ))}
                </div>
                <button type="button" className="lobby-modal-cta">
                  Unlock PRO
                </button>
              </div>
            ) : null}

            {activeOverlay === 'shop' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">Shop</div>
                <div className="lobby-shop-balance">150 coins</div>
                <section className="lobby-shop-section">
                  <h3>Skins</h3>
                  <div className="lobby-card-grid">
                    {SHOP_SKINS.map((item) => (
                      <article key={item.name} className="lobby-shop-card">
                        <strong>{item.name}</strong>
                        <span>{item.price}</span>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="lobby-shop-section">
                  <h3>Board Themes</h3>
                  <div className="lobby-card-grid">
                    {SHOP_THEMES.map((item) => (
                      <article key={item.name} className="lobby-shop-card">
                        <strong>{item.name}</strong>
                        <span>{item.price}</span>
                      </article>
                    ))}
                  </div>
                </section>
                <div className="lobby-pro-banner">
                  <div>
                    <strong>PRO: all skins + unlimited AI coach</strong>
                    <p>299 / month</p>
                  </div>
                  <button type="button" className="lobby-modal-cta lobby-modal-cta--small">
                    Try it
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const storedProfile = useProgressStore((state) => state.profile)
  const { cloudProfile, isAuthenticated, signOut, user } = useAuth()
  const [activeOverlay, setActiveOverlay] = useState<LobbyOverlay>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null)

  const profile = storedProfile

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `https://checktheaura.game/rooms/${activeRoomCode ?? 'ROOM'}`
    }

    return `${window.location.origin}/rooms/${activeRoomCode ?? 'ROOM'}`
  }, [activeRoomCode])

  const fallbackHero = getCurrentHeroArt('warrior', 1)
  const hero = profile ? getCurrentHeroArt(profile.classId, profile.level) : fallbackHero
  const levelProgress = getLevelProgress(profile?.xp ?? 0)
  const displayName =
    profile?.title ?? (isAuthenticated ? user?.email ?? 'Cloud Player' : 'Guest Player')
  const auraMeta = profile ? AURA_META[profile.classId] ?? AURA_META.fallback : AURA_META.fallback
  const questWidget = getQuestWidget(profile)
  const rankValue = profile ? String(profile.rankScore ?? profile.level) : '1'
  const winsValue = String(profile?.wins ?? 0)
  const gamesValue = String(profile?.gamesPlayed ?? 0)
  const battleLabel = profile ? '⚔ PLAY' : '⚔ CHOOSE CLASS'

  async function loadLeaderboard(scope: RegionTab) {
    if (!isAuthenticated || !user) {
      return
    }

    setLeaderboardLoading(true)
    setLeaderboardError(null)

    try {
      const entries = await fetchLeaderboard(scope === 'all' ? 'all' : scope, user.id)
      setLeaderboardEntries(entries)
    } catch (error) {
      setLeaderboardError(
        error instanceof Error ? error.message : 'Failed to load leaderboard.',
      )
    } finally {
      setLeaderboardLoading(false)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    const result = await signOut()
    setIsSigningOut(false)

    if (!result.error) {
      navigate('/', { replace: true })
    }
  }

  async function handleCreateRoom() {
    try {
      const result = await createRoom()
      setActiveRoomCode(result.room.room_code)
      navigate(`/rooms/${result.room.room_code}`)
    } catch (error) {
      setLeaderboardError(
        error instanceof Error ? error.message : 'Failed to create room.',
      )
    }
  }

  function handleJoinRoom() {
    const code = window.prompt('Enter room code')
    if (!code) {
      return
    }

    const normalizedCode = code.trim().toUpperCase()
    setActiveRoomCode(normalizedCode)
    navigate(`/rooms/${normalizedCode}`)
  }

  return (
    <section data-testid="lobby-shell" className="lobby-shell">
      <h1 data-testid="app-title" className="lobby-wordmark">
        CheckTheAura
      </h1>

      <div className="lobby-pattern" aria-hidden="true" />
      <div className="lobby-vignette" aria-hidden="true" />

      <div data-testid="lobby-profile-panel" className="lobby-player-card">
        <div className="lobby-player-card__avatar">
          <img src={hero.avatar} alt="Batyr avatar" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="lobby-player-card__name">{displayName}</p>
          <span className={['lobby-aura-pill', auraMeta.className].join(' ')}>{auraMeta.label}</span>
          <p className="lobby-player-card__meta">
            LVL {profile?.level ?? 1} • XP
            {profile?.city ? ` • ${profile.city}` : ''}
            {cloudProfile ? ' • cloud' : ''}
          </p>
          <div className="lobby-player-card__xp">
            <div
              className="lobby-player-card__xp-fill"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/84 transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            ) : (
              <button
                data-testid="auth-cta"
                type="button"
                onClick={() => navigate('/auth')}
                className="rounded-full border border-cyan-300/20 bg-cyan-400/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-50 transition hover:bg-cyan-400/18"
              >
                Upgrade to cloud
              </button>
            )}
          </div>
        </div>
      </div>

      <div data-testid="lobby-room-panel" className="lobby-room-card">
        <div>
          <p className="lobby-room-card__label">ROOM</p>
          <p className="lobby-room-card__code">{activeRoomCode ?? '-----'}</p>
        </div>
        <div className="lobby-room-card__actions">
          {isAuthenticated && activeRoomCode ? (
            <>
              <RoomActionButton label="Copy room code" onClick={() => copyTextSafely(activeRoomCode)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="9" y="9" width="10" height="10" rx="2" />
                  <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
                </svg>
              </RoomActionButton>
              <RoomActionButton label="Share invite link" onClick={() => shareInviteSafely(inviteUrl)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 13a5 5 0 0 0 7.54.54l2.92-2.92a5 5 0 0 0-7.07-7.07L11.72 5.2" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-2.92 2.92a5 5 0 0 0 7.07 7.07l1.67-1.65" />
                </svg>
              </RoomActionButton>
            </>
          ) : isAuthenticated ? (
            <>
              <RoomActionButton label="Create room" onClick={() => void handleCreateRoom()}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </RoomActionButton>
              <RoomActionButton label="Join room" onClick={handleJoinRoom}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M8 12h8M12 8l4 4-4 4" />
                </svg>
              </RoomActionButton>
            </>
          ) : (
            <RoomActionButton label="Sign in for rooms" onClick={() => navigate('/auth')}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            </RoomActionButton>
          )}
        </div>
      </div>

      <div className="lobby-side-actions lobby-side-actions--left">
        <StageActionButton
          label="Open leaderboard"
          icon={trophyStarIcon}
          onClick={() => setActiveOverlay('leaderboard')}
        />
        <StageActionButton
          label="Open skins"
          icon={schoolBagIcon}
          onClick={() => setActiveOverlay('skins')}
        />
        <StageActionButton
          label="Open shop"
          icon={shoppingCartIcon}
          onClick={() => setActiveOverlay('shop')}
        />
      </div>

      <div className="lobby-stage-wrap" data-testid="lobby-hero-stage">
        <LobbyStage
          portraitSrc={hero.portrait}
          heroLevel={profile?.level ?? 1}
          roomCode={activeRoomCode ?? 'ROOM'}
          friendSlots={2}
        />
      </div>

      <div className="lobby-side-actions lobby-side-actions--right">
        <article className="lobby-stat-card">
          <span className="lobby-stat-card__label">RANK</span>
          <div className="lobby-stat-card__value">
            {rankValue}
            {profile?.rankScore ? <span className="lobby-stat-card__trophy">🏆</span> : null}
          </div>
        </article>
        <article className="lobby-stat-card">
          <span className="lobby-stat-card__label">WINS</span>
          <div className="lobby-stat-card__value">{winsValue}</div>
        </article>
        <article className="lobby-stat-card">
          <span className="lobby-stat-card__label">GAMES</span>
          <div className="lobby-stat-card__value">{gamesValue}</div>
        </article>
      </div>

      <article className="lobby-quest-widget">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lobby-quest-widget__eyebrow">Daily quest</p>
            <p className="lobby-quest-widget__title">{questWidget.title}</p>
          </div>
          <span className="lobby-quest-widget__badge">2x XP</span>
        </div>
        <div className="lobby-quest-widget__progress">
          <div
            className="lobby-quest-widget__progress-fill"
            style={{ width: `${questWidget.progressPercent}%` }}
          />
        </div>
      </article>

      <button
        data-testid={profile ? 'battle-cta' : 'class-select-link'}
        type="button"
        className="lobby-play-button"
        onClick={() => navigate(profile ? '/versus' : '/class-select')}
      >
        <span className="lobby-play-button__label">{battleLabel}</span>
      </button>

      <LobbyOverlayModal
        activeOverlay={activeOverlay}
        onClose={() => setActiveOverlay(null)}
        canLoadLeaderboard={isAuthenticated}
        leaderboardEntries={leaderboardEntries}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        onLeaderboardScopeChange={(scope) => {
          void loadLeaderboard(scope)
        }}
      />
    </section>
  )
}
