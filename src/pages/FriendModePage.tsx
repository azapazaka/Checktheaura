import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { createRoom } from '../cloud/room-service'
import { useProgressStore } from '../store/progress-store'

export function FriendModePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const profile = useProgressStore((state) => state.profile)
  const [roomCode, setRoomCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  async function handleCreateRoom() {
    setErrorMessage(null)
    setIsCreating(true)

    try {
      const result = await createRoom()
      navigate(`/rooms/${result.room.room_code}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось создать комнату.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoinRoom() {
    const normalizedCode = roomCode.trim().toUpperCase()
    if (!normalizedCode) {
      setErrorMessage('Сначала введи код комнаты.')
      return
    }

    setErrorMessage(null)
    setIsJoining(true)

    try {
      navigate(`/rooms/${normalizedCode}`)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <section
      data-testid="friend-mode-shell"
      className="relative min-h-screen overflow-hidden bg-[#14110d] px-4 py-6 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(66,214,184,0.12),_transparent_26%),radial-gradient(circle_at_right,_rgba(112,211,255,0.08),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(255,188,88,0.08),_transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-white/54">
              Дуэль с другом
            </p>
            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">
              Открой комнату
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              В этом режиме код комнаты живёт только здесь: создай матч, отправь
              приглашение и переходи на живую доску.
            </p>
          </div>

          <Link
            to="/play"
            className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/14"
          >
            Назад к режимам
          </Link>
        </div>

        {!isAuthenticated ? (
          <div className="mt-10 rounded-[2.4rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,26,34,0.9),rgba(12,14,22,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-cyan-100/58">
              Нужен облачный вход
            </p>
            <h2 className="mt-4 font-display text-3xl text-white">Войди, чтобы дуэлиться вживую</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Комнаты друзей используют облачную авторизацию, общее состояние и
              обновления в реальном времени. Один вход, и ты сразу возвращаешься сюда
              с разблокированным управлением комнатой.
            </p>
            <Link
              to="/auth?next=/play/friend"
              className="mt-6 inline-flex rounded-[1.4rem] bg-[linear-gradient(135deg,#38bdf8,#14b8a6)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-950"
            >
              Войти для комнат
            </Link>
          </div>
        ) : !profile ? (
          <div className="mt-10 rounded-[2.4rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,26,34,0.9),rgba(12,14,22,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8">
            <h2 className="font-display text-3xl text-white">Сначала выбери класс</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Дуэль с другом использует активную личность героя, поэтому сначала закончи
              выбор класса, а потом возвращайся сюда.
            </p>
            <Link
              to="/class-select"
              className="mt-6 inline-flex rounded-[1.4rem] bg-[linear-gradient(135deg,#ffe059,#ff8a3d)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-950"
            >
              Выбрать класс
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
            <article className="rounded-[2.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(12,56,56,0.88),rgba(12,18,28,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-7">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-emerald-100/58">
                Хост комнаты
              </p>
              <h2 className="mt-4 font-display text-3xl text-white">Создать комнату</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Получишь свежий код, ссылку-приглашение и поверхность ожидания, пока
                друг не войдёт.
              </p>
              <div className="mt-6 flex min-h-56 items-center justify-center rounded-[2rem] border border-white/10 bg-black/14">
                <div className="grid gap-3 text-center">
                  <div className="mx-auto grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.8rem] border border-emerald-200/20 bg-emerald-300/10 text-3xl text-emerald-50">
                    +
                  </div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/46">
                    Новая дуэльная комната
                  </p>
                </div>
              </div>
              <button
                data-testid="create-room-cta"
                type="button"
                onClick={() => void handleCreateRoom()}
                disabled={isCreating}
                className="mt-6 inline-flex rounded-[1.5rem] bg-[linear-gradient(135deg,#34d399,#14b8a6)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Создаём...' : 'Создать комнату'}
              </button>
            </article>

            <article className="rounded-[2.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(26,30,42,0.92),rgba(12,14,22,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-7">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-cyan-100/58">
                Вход в комнату
              </p>
              <h2 className="mt-4 font-display text-3xl text-white">Войти по коду</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Вставь код от друга и сразу переходи на общую живую доску.
              </p>

              <label className="mt-6 grid gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-white/48">
                  Код комнаты
                </span>
                <input
                  data-testid="join-room-input"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value)}
                  placeholder="A1B2C"
                  maxLength={8}
                  className="rounded-[1.4rem] border border-white/12 bg-black/18 px-4 py-4 font-mono text-lg uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/28"
                />
              </label>

              {errorMessage ? (
                <p className="mt-4 rounded-[1.3rem] border border-rose-300/16 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </p>
              ) : null}

              <button
                data-testid="join-room-cta"
                type="button"
                onClick={() => void handleJoinRoom()}
                disabled={isJoining}
                className="mt-6 inline-flex rounded-[1.5rem] border border-white/14 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? 'Открываем...' : 'Войти в комнату'}
              </button>
            </article>
          </div>
        )}
      </div>
    </section>
  )
}
