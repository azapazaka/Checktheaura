# CheckTheAura

CheckTheAura — это RPG-платформа для игры в шашки с AI Coach, облачным прогрессом, friend-room multiplayer и рейтингом по городам Казахстана.

## Что это за продукт

Это не просто ещё один сайт с доской 8x8. CheckTheAura превращает партию в шашки в игровой цикл с ростом героя, облачным профилем, социальным соревнованием и AI-разбором после матча.

Игрок не только выигрывает или проигрывает партию, но и:
- прокачивает своего батыра
- открывает новые сложности и темы
- поднимается в рейтинге Казахстана и своего города
- сохраняет историю матчей и AI Coach разборов
- создаёт комнаты для игры с другом

## Для кого

CheckTheAura создан для:
- игроков, которым мало обычных шашек без мета-прогрессии
- любителей PvP и таблиц лидеров
- пользователей, которым важны анализ партии и развитие стратегического мышления
- игроков из Казахстана, которым интересен локальный рейтинг по городам

## Чем он уникален

Ключевые отличия продукта:
- `RPG progression` — каждая партия двигает героя вперёд по XP, уровням и unlocks
- `AI Coach` — после матча игрок получает понятный разбор сильных моментов и ошибок
- `Leaderboard by city` — рейтинг не абстрактный, а привязанный к Казахстану и конкретному городу
- `Friend-room multiplayer` — можно создать комнату и сыграть с другом по коду
- `Dark premium lobby` — продукт ощущается как игровой клиент, а не как обычный веб-сайт

## Какие фичи уже работают

Сейчас в проекте уже реализованы реальные рабочие сценарии:

- полноценная логика шашек:
  обязательное взятие, multi-capture, дамки, победа по блокировке и базовые правила матча
- игра против AI с несколькими уровнями сложности
- гостевой режим для быстрого старта без регистрации
- Supabase Auth:
  email/password и Google sign-in
- cloud onboarding:
  выбор класса, выбор города, перенос локального прогресса в облако
- cloud profile:
  сохранение прогресса, истории матчей и AI Coach history
- рейтинг по Казахстану и по городам
- friend-room multiplayer flow:
  создание комнаты, вход по коду, live room state
- AI Coach results screen:
  live/fallback анализ после завершения партии
- profile progression screen:
  рост героя, daily quests, история матчей, coach history

## Стек

- Frontend: `React 19`, `Vite`, `TypeScript`
- Routing: `react-router-dom`
- State: `Zustand`
- Styling: `Tailwind CSS v4` + custom CSS
- Backend layer: `Vercel API routes`
- Database/Auth/Realtime: `Supabase`
- Testing: `Vitest`, `Testing Library`, `Playwright`
- AI providers: `Groq` (primary-ready), `Anthropic` (fallback-ready)

## Live demo

`TODO before submission:` вставить ссылку на live demo после финального деплоя.

Рекомендуемый формат:

```text
https://your-live-demo-url
```

## GitHub

Репозиторий проекта:

[https://github.com/azapazaka/Checktheaura](https://github.com/azapazaka/Checktheaura)

Внутри уже лежат:
- фронтенд приложения
- Vercel API routes
- Supabase cloud integration
- SQL migration для leaderboard, profiles, matches, rooms и coach history

## Почему у проекта есть retention / business value

У CheckTheAura есть реальный потенциал как у сервиса, а не просто как у учебного приложения:

- `Ежедневные квесты` создают причину возвращаться каждый день
- `Leaderboard pressure` даёт социальную мотивацию подниматься выше по стране и городу
- `Profile progression` создаёт долгосрочную привычку продолжать играть ради роста героя
- `AI Coach history` добавляет обучающую ценность и делает продукт полезным не только как игру
- `Friend-room multiplayer` усиливает вирусность через приглашения друзей
- `PRO / skins` могут стать естественным слоем монетизации без разрушения core gameplay

## Локальный запуск
