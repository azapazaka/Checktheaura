const GUEST_IMPORT_DECISION_KEY = 'checktheaura-upgrade-decision'

export type GuestImportDecision = 'import' | 'fresh'

export function readGuestImportDecision(): GuestImportDecision | null {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(GUEST_IMPORT_DECISION_KEY)
  return value === 'import' || value === 'fresh' ? value : null
}

export function writeGuestImportDecision(value: GuestImportDecision | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(GUEST_IMPORT_DECISION_KEY)
    return
  }

  window.localStorage.setItem(GUEST_IMPORT_DECISION_KEY, value)
}
