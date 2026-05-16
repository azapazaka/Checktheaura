import type { PropsWithChildren } from 'react'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { createAuthValue } from './auth-mocks'

export function AuthTestProvider({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<AuthContextValue> }>) {
  return (
    <AuthContext.Provider value={createAuthValue(value)}>
      {children}
    </AuthContext.Provider>
  )
}
