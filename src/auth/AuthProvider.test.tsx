import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuth } from './AuthContext'
import { AuthProvider } from './AuthProvider'
import { useProgressStore } from '../store/progress-store'
import { createMockUser } from '../test/auth-mocks'

const signInWithOAuth = vi.fn()
const getSession = vi.fn()
const getUser = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('../lib/supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession,
      getUser,
      signInWithOAuth,
      onAuthStateChange,
    },
  })),
}))

vi.mock('../cloud/profile-service', () => ({
  bootstrapCloudProfile: vi.fn(),
  fetchCloudHistory: vi.fn(async () => []),
  fetchCloudProfile: vi.fn(async () => null),
  fetchCoachHistory: vi.fn(async () => []),
  hydrateStoreFromCloud: vi.fn(async () => null),
}))

vi.mock('../cloud/storage', () => ({
  readGuestImportDecision: vi.fn(() => null),
  writeGuestImportDecision: vi.fn(),
}))

function AuthHarness({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}

function SignInWithGoogleButton() {
  const { signInWithGoogle } = useAuth()

  return (
    <button type="button" onClick={() => void signInWithGoogle()}>
      Sign in with Google
    </button>
  )
}

function SessionStateProbe() {
  const { sessionMode } = useAuth()
  return <span>{sessionMode}</span>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState(useProgressStore.getInitialState(), true)
    signInWithOAuth.mockReset()
    getSession.mockReset()
    getUser.mockReset()
    onAuthStateChange.mockReset()
    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    getUser.mockResolvedValue({ data: { user: null } })
    signInWithOAuth.mockResolvedValue({ error: null })
  })

  test('forces Google account selection during OAuth sign in', async () => {
    const user = userEvent.setup()

    render(
      <AuthHarness>
        <SignInWithGoogleButton />
      </AuthHarness>,
    )

    await user.click(screen.getByRole('button', { name: /sign in with google/i }))

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        queryParams: {
          prompt: 'select_account',
        },
      }),
    })
  })

  test('clears the previous cloud profile when a different auth user signs in', async () => {
    useProgressStore.setState({
      ...useProgressStore.getInitialState(),
      profile: {
        classId: 'warrior',
        level: 7,
        xp: 720,
        title: 'Old Owner',
        stats: { str: 4, int: 2, agi: 1, lck: 0 },
        unspentStatPoints: 0,
        unlocks: { themes: ['default'], difficulties: ['easy'] },
        gamesPlayed: 12,
        wins: 8,
        history: [],
        dailyQuests: {
          date: '2026-05-18',
          completed: { playMatch: false, winMedium: false, crownKing: false },
        },
        authUserId: 'user-a',
        isGuest: false,
      },
    })

    const nextUser = createMockUser({ id: 'user-b', email: 'second@checktheaura.test' })

    getSession.mockResolvedValue({
      data: {
        session: {
          user: nextUser,
        },
      },
      error: null,
    })
    getUser.mockResolvedValue({ data: { user: nextUser } })

    render(
      <AuthHarness>
        <SessionStateProbe />
      </AuthHarness>,
    )

    await waitFor(() => {
      expect(screen.getByText(/onboarding/i)).toBeInTheDocument()
    })

    expect(useProgressStore.getState().profile).toBeNull()
  })
})
