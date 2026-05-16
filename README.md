# CheckTheAura

CheckTheAura — это MVP tactical-RPG игры в шашки на `React + Vite + TypeScript`, где каждая партия даёт XP, открывает прогресс профиля и заканчивается разбором через AI Coach.

## Что уже есть

- Полный движок шашек: обязательное взятие, multi-capture, дамки, победа по блокировке и правило 50 ходов.
- Локальный AI соперник с тремя уровнями сложности: `easy`, `medium`, `hard`.
- RPG-профиль на `Zustand + localStorage`: выбор класса, XP, уровни, unlocks, история матчей и очки характеристик.
- Маршруты MVP: `Home`, `ClassSelect`, `Game`, `Results`, `Profile`.
- AI Coach через serverless proxy `/api/coach/analyze` с безопасным вызовом Anthropic Messages API и локальным fallback-режимом.

## Стек

- Frontend: `React 19`, `Vite`, `TypeScript`, `react-router-dom`
- UI: `Tailwind CSS v4`, кастомные CSS variables
- State: `Zustand` + `persist`
- Testing: `Vitest`, `Testing Library`, `Playwright`
- AI Coach: `Anthropic Messages API` через Vercel serverless function

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть локально:

```text
http://localhost:5173
```

## Переменные окружения

Скопируй значения из `.env.example`.

```bash
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Если `ANTHROPIC_API_KEY` не задан, экран результатов всё равно работает: приложение покажет локальный fallback-анализ вместо сетевого запроса.

## Скрипты

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Структура MVP

```text
src/
  coach/        # fallback + contract/service logic
  game/         # engine, AI, match summary
  pages/        # Home, ClassSelect, Game, Results, Profile
  rpg/          # progression and profile types
  store/        # Zustand persistence
api/
  coach/        # Vercel serverless proxy
e2e/            # smoke Playwright flow
```

## GitHub / Release checklist

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- Проверить `ANTHROPIC_API_KEY` в Vercel Project Settings
- Задеплоить preview/production на Vercel

## Следующие шаги после MVP

- Кампания и named opponents
- Hot-seat режим
- Daily challenge
- Расширенные достижения и мета-прогрессия
- Магазин скинов и Pro-подписка
