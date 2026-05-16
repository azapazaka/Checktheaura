import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import schoolBagIcon from '../assets/lobby-icons/school-bag.png'
import shoppingCartIcon from '../assets/lobby-icons/shopping-cart.png'
import trophyStarIcon from '../assets/lobby-icons/trophy-star.png'
import { LobbyStage } from '../components/lobby/LobbyStage'
import { DAILY_QUEST_LABELS, getCurrentHeroArt } from '../rpg/meta'
import { getCurrentDailyQuests, getLevelProgress } from '../rpg/progression'
import { useProgressStore } from '../store/progress-store'

const ROOM_CODE = '777BA'

type LobbyOverlay = null | 'leaderboard' | 'skins' | 'shop'
type RegionTab = 'all' | 'almaty' | 'astana' | 'shymkent' | 'aktau'

const REGION_TABS: Array<{ id: RegionTab; label: string }> = [
  { id: 'all', label: 'Все КЗ' },
  { id: 'almaty', label: 'Алматы' },
  { id: 'astana', label: 'Астана' },
  { id: 'shymkent', label: 'Шымкент' },
  { id: 'aktau', label: 'Актау' },
]

const LEADERBOARD_PODIUM = [
  { rank: 1, name: 'Aruzhan', points: 2480, medal: '🥇' },
  { rank: 2, name: 'Nursultan', points: 2335, medal: '🥈' },
  { rank: 3, name: 'Dias', points: 2210, medal: '🥉' },
]

const LEADERBOARD_ROWS = [
  { rank: 4, name: 'Ademi', points: 2180 },
  { rank: 5, name: 'Aibek', points: 2140 },
  { rank: 6, name: 'Tomiris', points: 2095 },
  { rank: 7, name: 'Alikhan', points: 2040 },
  { rank: 8, name: 'Zarina', points: 1990 },
  { rank: 9, name: 'Bauyrzhan', points: 1940 },
  { rank: 10, name: 'Sanzhar', points: 1885 },
]

const SKIN_CARDS = [
  { name: 'Номад', status: 'Надеть', locked: false },
  { name: 'Хан', status: 'Активен ✓', locked: false },
  { name: 'Теневой', status: 'Уровень 15 🔒', locked: true },
  { name: 'Призрак', status: 'PRO 🔒', locked: true },
]

const SHOP_SKINS = [
  { name: 'Степной хан', price: '180 🪙' },
  { name: 'Железный батыр', price: '220 🪙' },
]

const SHOP_THEMES = [
  { name: 'Казахский орнамент', price: '120 🪙' },
  { name: 'Ночной город', price: '160 🪙' },
]

const AURA_META: Record<string, { label: string; className: string }> = {
  warrior: { label: '🔴 БЕРСЕРК', className: 'lobby-aura-pill--berserk' },
  strategist: { label: '🔵 ТАКТИК', className: 'lobby-aura-pill--tactician' },
  shadow: { label: '⚫ ТЕНЬ', className: 'lobby-aura-pill--shadow' },
  fallback: { label: '⚪ НОВИЧОК', className: 'lobby-aura-pill--rookie' },
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
      title: 'CheckTheAura',
      url: inviteUrl,
    })
    return
  }

  copyTextSafely(inviteUrl)
}

function getQuestWidget(profile: ReturnType<typeof useProgressStore.getState>['profile']) {
  if (!profile) {
    return {
      title: 'Победи на Medium AI',
      progressPercent: 33,
    }
  }

  const quests = getCurrentDailyQuests(profile.dailyQuests)
  const completedCount = Object.values(quests.completed).filter(Boolean).length
  const activeEntry = Object.entries(quests.completed).find(([, completed]) => !completed)

  if (!activeEntry) {
    return {
      title: 'Все квесты закрыты',
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
    <button
      type="button"
      aria-label={label}
      className="lobby-side-action"
      onClick={onClick}
    >
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
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="lobby-room-action"
    >
      {children}
    </button>
  )
}

function LobbyOverlayModal({
  activeOverlay,
  onClose,
}: {
  activeOverlay: LobbyOverlay
  onClose: () => void
}) {
  const [regionTab, setRegionTab] = useState<RegionTab>('aktau')

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
              aria-label="Закрыть"
              className="lobby-modal-close"
              onClick={onClose}
            >
              ✕
            </button>

            {activeOverlay === 'leaderboard' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">🏆 Рейтинг Казахстана</div>
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
                <div className="lobby-podium-grid">
                  {LEADERBOARD_PODIUM.map((entry) => (
                    <article key={entry.rank} className="lobby-podium-card">
                      <span className="lobby-podium-card__medal">{entry.medal}</span>
                      <strong>{entry.name}</strong>
                      <span>{entry.points} aura</span>
                    </article>
                  ))}
                </div>
                <div className="lobby-leaderboard-list">
                  {LEADERBOARD_ROWS.map((entry) => (
                    <div key={entry.rank} className="lobby-list-row">
                      <span>#{entry.rank}</span>
                      <strong>{entry.name}</strong>
                      <span>{entry.points}</span>
                    </div>
                  ))}
                </div>
                <p className="lobby-modal-footnote">Ваше место: #47 в регионе Актау</p>
              </div>
            ) : null}

            {activeOverlay === 'skins' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">🎒 Мои скины</div>
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
                  ⭐ Открыть PRO
                </button>
              </div>
            ) : null}

            {activeOverlay === 'shop' ? (
              <div className="lobby-modal-body">
                <div className="lobby-modal-header">🛒 Магазин</div>
                <div className="lobby-shop-balance">🪙 150</div>
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
                  <h3>Темы поля</h3>
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
                    <strong>⭐ PRO — все скины + безлимит AI коуч</strong>
                    <p>299 ₸/мес</p>
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
  const profile = useProgressStore((state) => state.profile)
  const [activeOverlay, setActiveOverlay] = useState<LobbyOverlay>(null)

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `https://checktheaura.game/room/${ROOM_CODE}`
    }

    return `${window.location.origin}/room/${ROOM_CODE}`
  }, [])

  const fallbackHero = getCurrentHeroArt('warrior', 1)
  const hero = profile
    ? getCurrentHeroArt(profile.classId, profile.level)
    : fallbackHero
  const levelProgress = getLevelProgress(profile?.xp ?? 0)
  const displayName = profile?.title ?? 'Новобранец'
  const auraMeta = profile ? AURA_META[profile.classId] ?? AURA_META.fallback : AURA_META.fallback
  const questWidget = getQuestWidget(profile)
  const rankValue = profile ? String(profile.level) : '1'
  const winsValue = String(profile?.wins ?? 0)
  const gamesValue = String(profile?.gamesPlayed ?? 0)
  const battleLabel = profile ? '⚔️ ИГРАТЬ' : '⚔️ ВЫБРАТЬ ПУТЬ'

  return (
    <section data-testid="lobby-shell" className="lobby-shell">
      <h1 data-testid="app-title" className="lobby-wordmark">
        CheckTheAura
      </h1>

      <div className="lobby-pattern" aria-hidden="true" />
      <div className="lobby-vignette" aria-hidden="true" />

      <div data-testid="lobby-profile-panel" className="lobby-player-card">
        <div className="lobby-player-card__avatar">
          <img src={hero.avatar} alt="Аватар Батыра" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="lobby-player-card__name">{displayName}</p>
          <span className={['lobby-aura-pill', auraMeta.className].join(' ')}>
            {auraMeta.label}
          </span>
          <p className="lobby-player-card__meta">LVL {profile?.level ?? 1} • XP</p>
          <div className="lobby-player-card__xp">
            <div
              className="lobby-player-card__xp-fill"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div data-testid="lobby-room-panel" className="lobby-room-card">
        <div>
          <p className="lobby-room-card__label">ROOM</p>
          <p className="lobby-room-card__code">{ROOM_CODE}</p>
        </div>
        <div className="lobby-room-card__actions">
          <RoomActionButton label="Copy room code" onClick={() => copyTextSafely(ROOM_CODE)}>
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
        </div>
      </div>

      <div className="lobby-side-actions lobby-side-actions--left">
        <StageActionButton
          label="Открыть рейтинг"
          icon={trophyStarIcon}
          onClick={() => setActiveOverlay('leaderboard')}
        />
        <StageActionButton
          label="Открыть скины"
          icon={schoolBagIcon}
          onClick={() => setActiveOverlay('skins')}
        />
        <StageActionButton
          label="Открыть магазин"
          icon={shoppingCartIcon}
          onClick={() => setActiveOverlay('shop')}
        />
      </div>

      <div className="lobby-stage-wrap" data-testid="lobby-hero-stage">
        <LobbyStage
          portraitSrc={hero.portrait}
          heroLevel={profile?.level ?? 1}
          roomCode={ROOM_CODE}
          friendSlots={2}
        />
      </div>

      <div className="lobby-side-actions lobby-side-actions--right">
        <article className="lobby-stat-card">
          <span className="lobby-stat-card__label">RANK</span>
          <div className="lobby-stat-card__value">
            {rankValue}
            {rankValue === '1' ? <span className="lobby-stat-card__trophy">🏆</span> : null}
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
            <p className="lobby-quest-widget__eyebrow">📅 Ежедневно</p>
            <p className="lobby-quest-widget__title">{questWidget.title}</p>
          </div>
          <span className="lobby-quest-widget__badge">2x XP 🔥</span>
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

      <LobbyOverlayModal activeOverlay={activeOverlay} onClose={() => setActiveOverlay(null)} />
    </section>
  )
}
