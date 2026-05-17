import { describe, expect, test, vi } from 'vitest'
import { ensureCloudProfileExists } from './supabase'

describe('ensureCloudProfileExists', () => {
  test('upserts a minimal cloud profile for an authenticated user', async () => {
    const upsert = vi.fn(async () => ({ error: null }))
    const from = vi.fn(() => ({ upsert }))

    await ensureCloudProfileExists(
      { from } as never,
      { id: 'user-123' },
    )

    expect(from).toHaveBeenCalledWith('profiles')
    expect(upsert).toHaveBeenCalledWith(
      { id: 'user-123' },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      },
    )
  })

  test('rethrows storage errors', async () => {
    const failure = new Error('insert failed')
    const upsert = vi.fn(async () => ({ error: failure }))
    const from = vi.fn(() => ({ upsert }))

    await expect(
      ensureCloudProfileExists(
        { from } as never,
        { id: 'user-123' },
      ),
    ).rejects.toThrow('insert failed')
  })
})
