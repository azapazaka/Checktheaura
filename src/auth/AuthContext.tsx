import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { CloudProfileRecord } from '../cloud/types'
import type { PlayerProfile, RpgClass } from '../rpg/types'

export type AuthCredentials = {
  email: string
  password: string
}

export type AuthActionResult = {
  error: string | null
  needsEmailConfirmation?: boolean
}

export type OnboardingPayload = {
  classId: RpgClass
  city: string
  importGuestProgress: boolean
}

export type AuthContextValue = {
  isAuthenticated: boolean
  isConfigured: boolean
  isLoading: boolean
  isProfileLoading: boolean
  sessionMode: 'guest' | 'authenticated' | 'upgrading' | 'onboarding'
  session: Session | null
  user: User | null
  cloudProfile: CloudProfileRecord | null
  localGuestProfile: PlayerProfile | null
  signInWithPassword: (credentials: AuthCredentials) => Promise<AuthActionResult>
  signInWithGoogle: (redirectPath?: string) => Promise<AuthActionResult>
  signOut: () => Promise<AuthActionResult>
  signUp: (credentials: AuthCredentials) => Promise<AuthActionResult>
  completeOnboarding: (payload: OnboardingPayload) => Promise<AuthActionResult>
  refreshCloudProfile: () => Promise<void>
}

async function unsupportedAction(): Promise<AuthActionResult> {
  return {
    error: 'Supabase Auth is not available in this context.',
  }
}

export const defaultAuthContextValue: AuthContextValue = {
  isAuthenticated: false,
  isConfigured: false,
  isLoading: false,
  isProfileLoading: false,
  sessionMode: 'guest',
  session: null,
  user: null,
  cloudProfile: null,
  localGuestProfile: null,
  signInWithPassword: unsupportedAction,
  signInWithGoogle: unsupportedAction,
  signOut: unsupportedAction,
  signUp: unsupportedAction,
  completeOnboarding: unsupportedAction,
  refreshCloudProfile: async () => {},
}

export const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue)

export function useAuth() {
  return useContext(AuthContext)
}
