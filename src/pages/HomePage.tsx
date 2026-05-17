import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import schoolBagIcon from '../assets/lobby-icons/school-bag.png'
import shoppingCartIcon from '../assets/lobby-icons/shopping-cart.png'
import trophyStarIcon from '../assets/lobby-icons/trophy-star.png'
import { fetchLeaderboard } from '../cloud/leaderboard-service'
import type { LeaderboardEntry, LeaderboardSnapshot } from '../cloud/types'
import { LobbyStage } from '../components/lobby/LobbyStage'
import { DAILY_QUEST_LABELS, getCurrentHeroArt } from '../rpg/meta'
import { getCurrentDailyQuests, getLevelProgress } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'

type LobbyOverlay = null | 'leaderboard' | 'skins' | 'shop'
type RegionTab = 'all' | string

const FEATURED_CITIES = ['Almaty', 'Astana', 'Shymkent', 'Aktau']
const LEADERBOARD_EMPTY_STATE =
  'Сыграй первый облачный матч, чтобы появиться в живом лидерборде.'

const SKIN_CARDS = [
  { name: 'Nomad', status: 'Надеть', locked: false },
  { name: 'Khan', status: 'Активен', locked: false },
  { name: 'Shadow', status: 'Уровень 15', locked: true },
  { name: 'Phantom', status: 'PRO', locked: true },
]

const SHOP_SKINS = [
  { name: 'Степной хан', price: '180 монет' },
  { name: 'Стальной батыр', price: '220 монет' },
]

const SHOP_THEMES = [
  { name: 'Казахский орнамент', price: '120 монет' },
  { name: 'Ночное ущелье', price: '160 монет' },
]

const AURA_META: Record<string, { label: string; className: string }> = {
  warrior: { label: 'Берсерк', className: 'lobby-aura-pill--berserk' },
  strategist: { label: 'Тактик', className: 'lobby-aura-pill--tactician' },
  shadow: { label: 'Тень', className: 'lobby-aura-pill--shadow' },
  fallback: { label: 'Новобранец', className: 'lobby-aura-pill--rookie' },
}

function getQuestWidget(profile: ReturnType<typeof useProgressStore.getState>['profile']) {
  if (!profile) {
    return {
      title: 'Победи Medium AI',
      progressPercent: 33,
    }
  }

  const quests = getCurrentDailyQuests(profile.dailyQuests)
  const completedCount = Object.values(quests.completed).filter(Boolean).length
  const activeEntry = Object.entries(quests.completed).find(([, completed]) => !completed)

  if (!activeEntry) {
    return {
      title: 'Все задания дня выполнены',
      progressPercent: 100,
    }
  }

  return {
    title: DAILY_QUEST_LABELS[activeEntry[0] as keyof typeof DAILY_QUEST_LABELS],
    progressPercent: Math.max(20, Math.round((completedCount / 3) * 100)),
  }
}

function createRegionTabs(currentCity?: string | null) {
  const values = ['all', ...FEATURED_CITIES]
  if (currentCity && !values.includes(currentCity)) {
    values.push(currentCity)
  }

  return values.map((id) => ({
    id,
    label: id === 'all' ? 'Весь KZ' : id,
  }))
}

function CommandActionButton({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string
  hint: string
  icon: string
  onClick: () => void
}) {
  return (
    <button type="button" aria-label={label} className="lobby-command-action" onClick={onClick}>
      <span className="lobby-command-action__icon-wrap">
        <img src={icon} alt="" className="lobby-command-action__icon" />
      </span>
      <span className="lobby-command-action__copy">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </button>
  )
}

function LeaderboardModalContent({
  regionTab,
  canLoadLeaderboard,
  leaderboardEntries,
  leaderboardCurrentUser,
  leaderboardTotalPlayers,
  leaderboardLoading,
  leaderboardError,
}: {
  regionTab: RegionTab
  canLoadLeaderboard: boolean
  leaderboardEntries: LeaderboardEntry[]
  leaderboardCurrentUser: LeaderboardEntry | null
  leaderboardTotalPlayers: number
  leaderboardLoading: boolean
  leaderboardError: string | null
}) {
  const podiumEntries = leaderboardEntries.slice(0, 3)
  const listEntries = leaderboardEntries.slice(3)
  const currentUserInTopList = leaderboardEntries.some((entry) => entry.isCurrentUser)
  const scopeLabel = regionTab === 'all' ? 'весь Казахстан' : regionTab

  if (!canLoadLeaderboard) {
    return (
      <p className="lobby-modal-footnote">
        Войди, чтобы открыть живой лидерборд Казахстана по городам.
      </p>
    )
  }

  if (leaderboardLoading) {
    return <p className="lobby-modal-footnote">Загружаем живые ранги...</p>
  }

  if (leaderboardError) {
    return <p className="lobby-modal-footnote">{leaderboardError}</p>
  }

  if (leaderboardEntries.length === 0) {
    return (
      <div className="lobby-leaderboard-empty">
        <strong>Пока в лидерборде пусто</strong>
        <p>{LEADERBOARD_EMPTY_STATE}</p>
      </div>
    )
  }

  return (
    <>
      <div className="lobby-podium-grid">
        {podiumEntries.map((entry, index) => (
          <article
            key={`${entry.userId}-${entry.rank}`}
            className={[
              'lobby-podium-card',
              index === 0 ? 'lobby-podium-card--first' : '',
              entry.isCurrentUser ? 'lobby-podium-card--current' : '',
            ].join(' ')}
          >
            <span className="lobby-podium-card__medal">
              {entry.rank === 1 ? 'I' : entry.rank === 2 ? 'II' : 'III'}
            </span>
            <span className="lobby-podium-card__rank">#{entry.rank}</span>
            <strong>{entry.title}</strong>
            <span>{entry.city ?? 'KZ'} • {entry.rankScore} aura</span>
            {entry.isCurrentUser ? <span className="lobby-current-badge">Ты</span> : null}
          </article>
        ))}
      </div>

      {leaderboardCurrentUser ? (
        <div className="lobby-current-rank-card">
          <span className="lobby-current-rank-card__eyebrow">Твоя позиция</span>
          <div className="lobby-current-rank-card__row">
            <strong>
              #{leaderboardCurrentUser.rank} • {leaderboardCurrentUser.title}
            </strong>
            <span className="lobby-current-badge">Ты</span>
          </div>
          <p>
            {leaderboardCurrentUser.city ?? 'KZ'} • {leaderboardCurrentUser.rankScore} aura
          </p>
        </div>
      ) : null}

      <div className="lobby-leaderboard-list">
        {listEntries.map((entry) => (
          <div
            key={`${entry.userId}-${entry.rank}`}
            className={[
              'lobby-list-row',
              entry.isCurrentUser ? 'lobby-list-row--current' : '',
            ].join(' ')}
          >
            <span>#{entry.rank}</span>
            <div className="lobby-list-row__identity">
              <strong>{entry.title}</strong>
              <small>{entry.city ?? 'KZ'}</small>
            </div>
            <div className="lobby-list-row__meta">
              {entry.isCurrentUser ? <span className="lobby-current-badge">Ты</span> : null}
              <span>{entry.rankScore}</span>
            </div>
          </div>
        ))}
      </div>

      {leaderboardCurrentUser && !currentUserInTopList ? (
        <div className="lobby-current-rank-card lobby-current-rank-card--floating">
          <span className="lobby-current-rank-card__eyebrow">Вне подиума</span>
          <div className="lobby-current-rank-card__row">
            <strong>
              #{leaderboardCurrentUser.rank} • {leaderboardCurrentUser.title}
            </strong>
            <span className="lobby-current-badge">Ты</span>
          </div>
          <p>
            {leaderboardCurrentUser.city ?? 'KZ'} • {leaderboardCurrentUser.rankScore} aura
          </p>
        </div>
      ) : null}

      <p className="lobby-modal-footnote">
        {leaderboardTotalPlayers} игроков • {scopeLabel}
      </p>
    </>
  )
}

function LobbyOverlayModal({
  activeOverlay,
  onClose,
  initialScope,
  canLoadLeaderboard,
  leaderboardEntries,
  leaderboardCurrentUser,
  leaderboardTotalPlayers,
  leaderboardLoading,
  leaderboardError,
  onLeaderboardScopeChange,
}: {
  activeOverlay: LobbyOverlay
  onClose: () => void
  initialScope: RegionTab
  canLoadLeaderboard: boolean
  leaderboardEntries: LeaderboardEntry[]
  leaderboardCurrentUser: LeaderboardEntry | null
  leaderboardTotalPlayers: number
  leaderboardLoading: boolean
  leaderboardError: string | null
  onLeaderboardScopeChange: (scope: RegionTab) => void
}) {
  const [regionTab, setRegionTab] = useState<RegionTab>(initialScope)
  const regionTabs = useMemo(
    () => createRegionTabs(initialScope === 'all' ? null : initialScope),
    [initialScope],
  )

  useEffect(() => {
    if (activeOverlay === 'leaderboard') {
      onLeaderboardScopeChange(regionTab)
    }
  }, [activeOverlay, onLeaderboardScopeChange, regionTab])

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
              aria-label="Закрыть окно"
              className="lobby-modal-close"
              onClick={onClose}
            >
              x
            </button>

            {activeOverlay === 'leaderboard' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">Лидерборд Казахстана</div>
                <div className="lobby-region-tabs">
                  {regionTabs.map((tab) => (
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
                <LeaderboardModalContent
                  regionTab={regionTab}
                  canLoadLeaderboard={canLoadLeaderboard}
                  leaderboardEntries={leaderboardEntries}
                  leaderboardCurrentUser={leaderboardCurrentUser}
                  leaderboardTotalPlayers={leaderboardTotalPlayers}
                  leaderboardLoading={leaderboardLoading}
                  leaderboardError={leaderboardError}
                />
              </div>
            ) : null}

            {activeOverlay === 'skins' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">Скины арсенала</div>
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
                  Открыть PRO
                </button>
              </div>
            ) : null}

            {activeOverlay === 'shop' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">Лавка фронтира</div>
                <div className="lobby-shop-balance">150 монет</div>
                <section className="lobby-shop-section">
                  <h3>Скины</h3>
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
                  <h3>Темы доски</h3>
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
                    <strong>PRO: все скины + безлимитный AI Coach</strong>
                    <p>299 / месяц</p>
                  </div>
                  <button type="button" className="lobby-modal-cta lobby-modal-cta--small">
                    Попробовать
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
  const { isAuthenticated, signOut, user } = useAuth()
  const [activeOverlay, setActiveOverlay] = useState<LobbyOverlay>(null)
  const [isCommandPanelOpen, setIsCommandPanelOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [leaderboardSnapshot, setLeaderboardSnapshot] = useState<LeaderboardSnapshot>({
    entries: [],
    currentUserEntry: null,
    totalPlayers: 0,
  })
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  const profile = storedProfile
  const fallbackHero = getCurrentHeroArt('warrior', 1)
  const hero = profile ? getCurrentHeroArt(profile.classId, profile.level) : fallbackHero
  const levelProgress = getLevelProgress(profile?.xp ?? 0)
  const displayName =
    profile?.title ??
    (isAuthenticated
      ? user?.user_metadata?.display_name ?? user?.email ?? 'Облачный игрок'
      : 'Гостевой игрок')
  const auraMeta = profile ? AURA_META[profile.classId] ?? AURA_META.fallback : AURA_META.fallback
  const questWidget = getQuestWidget(profile)
  const rankValue = String(profile?.rankScore ?? profile?.level ?? 1)
  const winsValue = String(profile?.wins ?? 0)
  const gamesValue = String(profile?.gamesPlayed ?? 0)
  const battleLabel = profile ? 'PLAY' : 'ВЫБРАТЬ КЛАСС'
  const preferredRegionTab = useMemo<RegionTab>(() => {
    const city = profile?.city
    return city && city.length > 0 ? city : 'all'
  }, [profile?.city])

  const handleLeaderboardScopeChange = useCallback(
    (scope: RegionTab) => {
      if (!user) {
        return
      }

      setLeaderboardLoading(true)
      setLeaderboardError(null)

      fetchLeaderboard(scope, user.id)
        .then((snapshot) => {
          setLeaderboardSnapshot(snapshot)
        })
        .catch((error) => {
          setLeaderboardError(
            error instanceof Error ? 'Не удалось загрузить лидерборд.' : 'Не удалось загрузить лидерборд.',
          )
        })
        .finally(() => {
          setLeaderboardLoading(false)
        })
    },
    [user],
  )

  async function handleSignOut() {
    setIsSigningOut(true)
    const result = await signOut()
    setIsSigningOut(false)

    if (!result.error) {
      navigate('/', { replace: true })
    }
  }

  function handleOpenOverlay(overlay: Exclude<LobbyOverlay, null>) {
    setIsCommandPanelOpen(false)
    setActiveOverlay(overlay)
  }

  return (
    <section data-testid="lobby-shell" className="lobby-shell">
      <div className="lobby-pattern" aria-hidden="true" />
      <div className="lobby-vignette" aria-hidden="true" />
      <div className="lobby-aurora" aria-hidden="true" />

      <header className="lobby-room-hud">
        <div className="lobby-room-hud__brand">
          <span className="lobby-room-hud__eyebrow">Штаб арены</span>
          <h1 data-testid="app-title" className="lobby-wordmark">
            CheckTheAura
          </h1>
        </div>

        <div className="lobby-room-hud__status">
          <div>
            <p className="lobby-room-hud__label">Главный цикл</p>
            <p className="lobby-room-hud__code">Бой / Дуэль / День</p>
          </div>
          <div className="lobby-room-hud__presence">
            <span>Фокус</span>
            <strong>Арена</strong>
          </div>
        </div>
      </header>

      <aside data-testid="lobby-player-hud" className="lobby-player-hud">
        <div className="lobby-player-hud__avatar">
          <img src={hero.avatar} alt="Batyr avatar" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="lobby-player-hud__heading">
            <div>
              <p className="lobby-player-hud__label">Профиль героя</p>
              <p className="lobby-player-hud__name">{displayName}</p>
            </div>
            <span className="lobby-player-hud__level">LVL {profile?.level ?? 1}</span>
          </div>
          <span className={['lobby-aura-pill', auraMeta.className].join(' ')}>
            {auraMeta.label}
          </span>
          <p className="lobby-player-hud__meta">
            Канал XP
            {profile?.city ? ` • ${profile.city}` : ' • Гостевой сектор'}
          </p>
          <div className="lobby-player-hud__xp">
            <div
              className="lobby-player-hud__xp-fill"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="lobby-secondary-button"
              >
                {isSigningOut ? 'Выходим...' : 'Выйти'}
              </button>
            ) : (
              <button
                data-testid="auth-cta"
                type="button"
                onClick={() => navigate('/auth')}
                className="lobby-secondary-button lobby-secondary-button--accent"
              >
                Войти в облако
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="lobby-stage-wrap" data-testid="lobby-hero-stage">
        <LobbyStage
          portraitSrc={hero.portrait}
          heroLevel={profile?.level ?? 1}
          friendSlots={2}
          stageLabel="СВЯТИЛИЩЕ"
        />
      </div>

      <button
        data-testid={profile ? 'battle-cta' : 'class-select-link'}
        type="button"
        className="lobby-play-button"
        onClick={() => navigate(profile ? '/play' : '/class-select')}
      >
        <span className="lobby-play-button__eyebrow">Войти в очередь арены</span>
        <span className="lobby-play-button__label">{battleLabel}</span>
      </button>

      <div className="lobby-command-dock">
        <button
          data-testid="lobby-command-trigger"
          type="button"
          aria-expanded={isCommandPanelOpen}
          className="lobby-command-trigger"
          onClick={() => setIsCommandPanelOpen((current) => !current)}
        >
          <span className="lobby-command-trigger__eyebrow">Тактическая панель</span>
          <span className="lobby-command-trigger__label">
            {isCommandPanelOpen ? 'Свернуть системы' : 'Открыть системы'}
          </span>
        </button>

        <AnimatePresence>
          {isCommandPanelOpen ? (
            <motion.aside
              data-testid="lobby-command-panel"
              className="lobby-command-panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="lobby-command-panel__header">
                <div>
                  <p className="lobby-command-panel__eyebrow">Операции</p>
                  <h2 className="lobby-command-panel__title">Командный отсек</h2>
                </div>
                <button
                  type="button"
                  className="lobby-command-panel__close"
                  onClick={() => setIsCommandPanelOpen(false)}
                >
                  x
                </button>
              </div>

              <div className="lobby-command-actions">
                <CommandActionButton
                  label="Открыть лидерборд"
                  hint="Посмотреть ранги Казахстана"
                  icon={trophyStarIcon}
                  onClick={() => handleOpenOverlay('leaderboard')}
                />
                <CommandActionButton
                  label="Открыть скины"
                  hint="Управлять внешним видом героя"
                  icon={schoolBagIcon}
                  onClick={() => handleOpenOverlay('skins')}
                />
                <CommandActionButton
                  label="Открыть магазин"
                  hint="Тратить монеты и открывать награды"
                  icon={shoppingCartIcon}
                  onClick={() => handleOpenOverlay('shop')}
                />
              </div>

              <div className="lobby-command-stats">
                <article className="lobby-stat-card">
                  <span className="lobby-stat-card__label">Ранг</span>
                  <div className="lobby-stat-card__value">
                    {rankValue}
                    {profile?.rankScore ? <span className="lobby-stat-card__trophy">T</span> : null}
                  </div>
                </article>
                <article className="lobby-stat-card">
                  <span className="lobby-stat-card__label">Победы</span>
                  <div className="lobby-stat-card__value">{winsValue}</div>
                </article>
                <article className="lobby-stat-card">
                  <span className="lobby-stat-card__label">Матчи</span>
                  <div className="lobby-stat-card__value">{gamesValue}</div>
                </article>
              </div>

              <article className="lobby-quest-widget">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="lobby-quest-widget__eyebrow">Задание дня</p>
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
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      <LobbyOverlayModal
        activeOverlay={activeOverlay}
        onClose={() => setActiveOverlay(null)}
        initialScope={preferredRegionTab}
        canLoadLeaderboard={isAuthenticated}
        leaderboardEntries={leaderboardSnapshot.entries}
        leaderboardCurrentUser={leaderboardSnapshot.currentUserEntry}
        leaderboardTotalPlayers={leaderboardSnapshot.totalPlayers}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        onLeaderboardScopeChange={handleLeaderboardScopeChange}
      />
    </section>
  )
}
