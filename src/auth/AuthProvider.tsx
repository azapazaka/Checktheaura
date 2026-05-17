import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  AuthContext,
  type AuthActionResult,
  type AuthCredentials,
  type OnboardingPayload,
} from './AuthContext'
import {
  bootstrapCloudProfile,
  fetchCloudHistory,
  fetchCloudProfile,
  fetchCoachHistory,
  hydrateStoreFromCloud,
} from '../cloud/profile-service'
import { mergeAnalysisIntoHistory, mapCloudMatchToSummary } from '../cloud/mappers'
import { readGuestImportDecision, writeGuestImportDecision } from '../cloud/storage'
import type { CloudProfileRecord } from '../cloud/types'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { useProgressStore } from '../store/progress-store'

const PROGRESS_OWNER_KEY = 'checktheaura-progress-owner'

function syncProgressOwner(userId: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!userId) {
    window.localStorage.removeItem(PROGRESS_OWNER_KEY)
    return
  }

  window.localStorage.setItem(PROGRESS_OWNER_KEY, userId)
}

function getMissingConfigResult(): AuthActionResult {
  return {
    error: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable auth.',
  }
}

function clearHydratedCloudState() {
  useProgressStore.setState((state) => ({
    ...state,
    profile: null,
    lastResult: null,
  }))
}

export function AuthProvider({ children }: PropsWithChildren) {
  const supabase = getSupabaseBrowserClient()
  const isConfigured = supabase !== null
  const localGuestProfile = useProgressStore((state) => state.profile)
  const settings = useProgressStore((state) => state.settings)
  const hydrateHistory = useProgressStore((state) => state.hydrateHistory)
  const [isLoading, setIsLoading] = useState(isConfigured)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [cloudProfile, setCloudProfile] = useState<CloudProfileRecord | null>(null)
  const [sessionMode, setSessionMode] = useState<
    'guest' | 'authenticated' | 'upgrading' | 'onboarding'
  >('guest')
  const lastSessionUserIdRef = useRef<string | null>(null)

  const refreshCloudProfile = useCallback(async () => {
    if (!supabase) {
      return
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      clearHydratedCloudState()
      startTransition(() => {
        setCloudProfile(null)
        setSessionMode('guest')
      })
      return
    }

    setIsProfileLoading(true)

    try {
      const nextCloudProfile = await fetchCloudProfile(authUser.id)

      if (!nextCloudProfile) {
        const currentLocalProfile = useProgressStore.getState().profile
        const hasLocalGuestProgress =
          currentLocalProfile !== null &&
          (currentLocalProfile.isGuest ?? true) &&
          !currentLocalProfile.authUserId

        startTransition(() => {
          setCloudProfile(null)
          setSessionMode(hasLocalGuestProgress ? 'upgrading' : 'onboarding')
        })
        return
      }

      const [historyRows, analysisRows] = await Promise.all([
        fetchCloudHistory(authUser.id),
        fetchCoachHistory(authUser.id),
      ])

      const mergedHistory = mergeAnalysisIntoHistory(
        historyRows.map(mapCloudMatchToSummary),
        analysisRows,
      )

      await hydrateStoreFromCloud(nextCloudProfile, mergedHistory)
      hydrateHistory(mergedHistory)

      startTransition(() => {
        setCloudProfile(nextCloudProfile)
        setSessionMode('authenticated')
      })
    } finally {
      startTransition(() => {
        setIsProfileLoading(false)
        setIsLoading(false)
      })
    }
  }, [hydrateHistory, supabase])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isMounted = true

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) {
        return
      }

      const nextUserId = nextSession?.user.id ?? null
      const currentProfile = useProgressStore.getState().profile
      const currentProfileUserId = currentProfile?.authUserId ?? null

      if (
        currentProfileUserId &&
        currentProfileUserId !== nextUserId &&
        lastSessionUserIdRef.current !== nextUserId
      ) {
        clearHydratedCloudState()
      }

      lastSessionUserIdRef.current = nextUserId
      syncProgressOwner(nextUserId)

      startTransition(() => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
      })

      if (!nextSession?.user) {
        clearHydratedCloudState()
        startTransition(() => {
          setCloudProfile(null)
          setSessionMode('guest')
          setIsProfileLoading(false)
          setIsLoading(false)
        })
        return
      }

      void refreshCloudProfile()
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        applySession(null)
        return
      }

      applySession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [refreshCloudProfile, supabase])

  const value = {
    isAuthenticated: user !== null,
    isConfigured,
    isLoading,
    isProfileLoading,
    sessionMode,
    session,
    user,
    cloudProfile,
    localGuestProfile,
    signInWithPassword: async ({ email, password }: AuthCredentials) => {
      if (!supabase) {
        return getMissingConfigResult()
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })

      return {
        error: error?.message ?? null,
      }
    },
    signInWithGoogle: async () => {
      if (!supabase) {
        return getMissingConfigResult()
      }

      const redirectTo =
        typeof window === 'undefined'
          ? undefined
          : `${window.location.origin}/auth`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      return {
        error: error?.message ?? null,
      }
    },
    signOut: async () => {
      if (!supabase) {
        return getMissingConfigResult()
      }

      writeGuestImportDecision(null)

      const { error } = await supabase.auth.signOut({ scope: 'local' })

      return {
        error: error?.message ?? null,
      }
    },
    signUp: async ({ email, password }: AuthCredentials) => {
      if (!supabase) {
        return getMissingConfigResult()
      }

      const redirectTo =
        typeof window === 'undefined'
          ? undefined
          : `${window.location.origin}/auth`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      return {
        error: error?.message ?? null,
        needsEmailConfirmation: !data.session,
      }
    },
    completeOnboarding: async ({ classId, city, importGuestProgress }: OnboardingPayload) => {
      if (!supabase) {
        return getMissingConfigResult()
      }

      try {
        const response = await bootstrapCloudProfile({
          classId,
          city,
          importGuestProgress,
          localProfile: importGuestProgress ? localGuestProfile : null,
          localSettings: settings,
        })

        const mergedHistory = response.importedHistory ?? []
        await hydrateStoreFromCloud(response.profile, mergedHistory)
        hydrateHistory(mergedHistory)
        setCloudProfile(response.profile)
        setSessionMode('authenticated')
        writeGuestImportDecision(null)

        return { error: null }
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to complete onboarding.',
        }
      }
    },
    refreshCloudProfile,
  }

  useEffect(() => {
    const decision = readGuestImportDecision()

    if (user && !cloudProfile && decision === 'fresh' && sessionMode === 'upgrading') {
      startTransition(() => {
        setSessionMode('onboarding')
      })
    }
  }, [cloudProfile, sessionMode, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
