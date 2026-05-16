export function getSupabaseConfig() {
  const url =
    import.meta.env.VITE_SUPABASE_URL?.trim() ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    return null
  }

  return {
    publishableKey,
    url,
  }
}
