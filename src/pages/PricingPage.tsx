import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useProgressStore } from '../store/progress-store'

export function PricingPage() {
  const { isAuthenticated, user } = useAuth()
  const profile = useProgressStore((state) => state.profile)
  const [isLoading, setIsLoading] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/auth?next=/pricing" replace />
  }

  // Use (profile as unknown as { is_pro?: boolean }).is_pro until CloudProfileRecord is fully updated in TS
  if (profile && (profile as unknown as { is_pro?: boolean }).is_pro) {
    return (
      <section className="arcade-panel mx-auto max-w-2xl rounded-[2.5rem] p-8 text-center">
        <h2 className="font-display text-4xl text-white">У вас уже есть PRO!</h2>
        <p className="mt-4 text-base leading-7 text-white/72">
          Наслаждайтесь безлимитным AI Coach и эксклюзивными скинами.
        </p>
      </section>
    )
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Ошибка при создании сессии оплаты: ' + data.error)
      }
    } catch (err) {
      console.error(err)
      alert('Ошибка соединения.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-center">
      <article className="arcade-panel rounded-[2.5rem] p-6 sm:p-8">
        <p className="arcade-kicker">CheckTheAura PRO</p>
        <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Подними игру на новый уровень
        </h1>
        <p className="mt-4 text-base leading-7 text-white/72">
          Открой полный доступ к умному визуальному разбору партий от AI Coach и получи золотой статус профиля.
        </p>
        <div className="mt-8 space-y-4">
          {[
            'Безлимитный AI разбор каждой партии с детальными подсветками ошибок',
            'Золотой бейдж в таблице лидеров',
            'Эксклюзивные тёмные темы и скины для доски',
            'Поддержка развития проекта',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-xs text-emerald-400">
                ✓
              </span>
              <span className="text-sm text-white/88">{feature}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="arcade-panel rounded-[2.5rem] bg-[linear-gradient(180deg,rgba(255,213,79,0.08),transparent)] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-lg font-bold uppercase tracking-widest text-yellow-400">
            PRO Подписка
          </p>
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="font-display text-6xl text-white">$4.99</span>
            <span className="text-lg text-white/50">/ месяц</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleCheckout()}
          disabled={isLoading}
          className="mt-8 w-full rounded-full bg-[linear-gradient(90deg,#ffd54f,#ff9f1c)] py-4 text-center font-bold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Перенаправление...' : 'Оформить подписку'}
        </button>
        <p className="mt-4 text-center text-xs text-white/40">
          Безопасная оплата через Stripe. Отменить можно в любой момент.
        </p>
      </article>
    </section>
  )
}
