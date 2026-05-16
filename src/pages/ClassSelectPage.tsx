import { useNavigate } from 'react-router-dom'
import { CLASS_META, getHeroArt, getVisibleStarterClasses } from '../rpg/meta'
import { useProgressStore } from '../store/progress-store'

const familyClasses = {
  crimson: {
    card: 'from-rose-950/82 via-red-950/68 to-orange-950/60',
    glow: 'shadow-[0_26px_70px_rgba(255,77,109,0.33)]',
    ring: 'border-rose-300/22',
    button: 'from-red-500 to-orange-400 text-white',
    badge: 'bg-red-400/16 text-red-100',
  },
  azure: {
    card: 'from-slate-950/82 via-blue-950/72 to-cyan-950/60',
    glow: 'shadow-[0_26px_70px_rgba(72,184,255,0.28)]',
    ring: 'border-cyan-300/22',
    button: 'from-blue-500 to-cyan-400 text-white',
    badge: 'bg-cyan-400/16 text-cyan-100',
  },
  shadow: {
    card: 'from-slate-950/82 via-violet-950/68 to-indigo-950/60',
    glow: 'shadow-[0_26px_70px_rgba(140,115,255,0.3)]',
    ring: 'border-violet-300/22',
    button: 'from-violet-500 to-indigo-400 text-white',
    badge: 'bg-violet-400/16 text-violet-100',
  },
} as const

export function ClassSelectPage() {
  const navigate = useNavigate()
  const selectClass = useProgressStore((state) => state.selectClass)
  const classIds = getVisibleStarterClasses()

  return (
    <section className="grid gap-5">
      <div className="arcade-panel rounded-[2.4rem] px-6 py-8 sm:px-8">
        <p className="arcade-kicker">Choose your path</p>
        <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
          Выберите архетип
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
          В самом начале ты выбираешь только два пути. Воин идет через натиск и
          красную ауру, а Стратег побеждает холодным расчетом и контролем поля.
          Слабая форма героя в лобби станет отправной точкой для роста.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {classIds.map((classId) => {
          const item = CLASS_META[classId]
          const art = getHeroArt(classId)
          const colors = familyClasses[item.colorFamily]

          return (
            <article
              key={classId}
              className={[
                'arcade-panel overflow-hidden rounded-[2.4rem] border bg-gradient-to-br p-6 sm:p-7',
                colors.card,
                colors.ring,
                colors.glow,
              ].join(' ')}
            >
              <div className="flex flex-col gap-6 xl:flex-row">
                <div className="flex-1">
                  <span
                    className={[
                      'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]',
                      colors.badge,
                    ].join(' ')}
                  >
                    {item.accent}
                  </span>
                  <h3 className="mt-4 font-display text-4xl text-white sm:text-5xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/74">
                    {item.perk}
                  </p>
                  <div className="mt-5 rounded-[1.7rem] border border-white/14 bg-black/18 px-4 py-4 text-sm leading-6 text-white/78">
                    <strong className="block text-white">Активный бонус</strong>
                    <span className="mt-2 block">{item.activeBonus}</span>
                  </div>
                </div>

                <div className="grid flex-[0.92] gap-4">
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-black/22 p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12),_transparent_58%)]" />
                    <img
                      src={art.full}
                      alt={`${item.title === 'Воин' ? 'Warrior' : 'Strategist'} hero`}
                      className="relative z-10 mx-auto h-[18rem] w-full object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.46)]"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-black/26 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/76">
                      Final Form
                    </div>
                  </div>

                  <div className="grid grid-cols-[0.92fr_1.08fr] gap-4">
                    <div className="rounded-[1.7rem] border border-white/14 bg-black/18 p-3">
                      <img
                        src={art.baseThin}
                        alt={`${item.title} base form`}
                        className="mx-auto h-40 w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col justify-between rounded-[1.7rem] border border-white/14 bg-white/8 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/66">
                          Start form
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/82">
                          Худой стартовый герой в лобби. Именно его игрок будет
                          прокачивать до сильной armored-версии.
                        </p>
                      </div>
                      <button
                        data-testid={`class-select-${classId}`}
                        type="button"
                        onClick={() => {
                          selectClass(classId)
                          navigate('/')
                        }}
                        className={[
                          'mt-4 rounded-[1.3rem] bg-gradient-to-r px-4 py-3 text-base font-bold shadow-[0_16px_24px_rgba(0,0,0,0.28)] transition hover:translate-y-[-1px]',
                          colors.button,
                        ].join(' ')}
                      >
                        {item.buttonLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
