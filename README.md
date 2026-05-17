# CheckTheAura

CheckTheAura is a browser game that turns checkers into a progression-driven RPG loop with AI coaching, cloud profiles, friend-room multiplayer, and Kazakhstan city leaderboards.

## What the project includes

- Full checkers gameplay logic: forced captures, multi-capture, kings, turn flow, and match outcome rules.
- RPG progression: XP, levels, unlocks, daily quests, and hero identity.
- AI Coach: post-match analysis with live provider support and local fallback analysis.
- Supabase Auth: email/password and Google sign-in.
- Cloud profile flow: onboarding, profile sync, match history, coach history, and leaderboard presence.
- Friend-room multiplayer: create a room, share a code, join live, and play on a shared board.
- Dark premium game-style lobby and mode-select flow.

## Stack

- Frontend: `React 19`, `Vite`, `TypeScript`
- Routing: `react-router-dom`
- State: `Zustand`
- Styling: `Tailwind CSS v4` + custom CSS
- API layer: `Vercel API routes`
- Backend services: `Supabase`
- Testing: `Vitest`, `Testing Library`, `Playwright`
- AI providers: `Groq`, `Anthropic`

## Repository

- GitHub: [azapazaka/Checktheaura](https://github.com/azapazaka/Checktheaura)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create env file

Copy `.env.example` into `.env.local` and fill in the values you actually use:

```bash
COACH_AI_PROVIDER=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Minimum useful setup for auth, cloud profile, and rooms:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_URL=your_project_url
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional setup for live AI Coach:

```bash
COACH_AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
```

If no external AI provider is available, the results screen still falls back to local coach analysis.

### 3. Start the app

Recommended local command:

```bash
npm run dev
```

This starts:

- Vite frontend
- local `/api` routes
- the cloud-style local flow used by friend rooms and Playwright e2e

If you only want the plain frontend without the local API bridge:

```bash
npm run dev:vite
```

Legacy alias for the combined frontend + local API flow:

```bash
npm run dev:cloud
```

## Useful commands

```bash
npm run build
npm run test
npm run test:e2e
```

## Auth and cloud notes

- Browser auth uses Supabase session storage.
- Protected cloud features include profile sync, leaderboard access, and friend-room multiplayer.
- Local guest play still works for solo AI matches.

## Current gameplay flow

- Lobby
- Mode select
- Training against AI
- Daily challenge
- Friend duel room flow
- Results screen with XP and coach feedback
- Profile progression

## Deployment

The app is structured for Vercel:

- SPA routes are rewritten to `index.html`
- API endpoints live under `api/*`
- Supabase powers auth, storage of player data, leaderboard data, and room state

## README status

This README is intentionally focused on the current real project state:

- it reflects the current `npm` scripts
- it documents the local cloud-dev flow required for rooms and e2e
- it removes outdated placeholders and broken encoding from the older version
