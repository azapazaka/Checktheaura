import type { User } from '@supabase/supabase-js'
import {
  defaultAuthContextValue,
  type AuthContextValue,
} from '../auth/AuthContext'

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-05-16T00:00:00.000Z',
    email: 'player@checktheaura.test',
    factors: [],
    identities: [],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-05-16T00:00:00.000Z',
    user_metadata: {
      display_name: 'Test Player',
    },
    ...overrides,
  }
}

export function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    ...defaultAuthContextValue,
    isConfigured: true,
    sessionMode: overrides.isAuthenticated ? 'authenticated' : 'guest',
    ...overrides,
  }
}
