import { expect, test } from '@playwright/test'

test('new user goes through class select, dark premium lobby, versus, battle, and profile', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-title')).toBeVisible()

  await page.getByTestId('class-select-link').click()
  await expect(page.getByTestId('class-select-warrior')).toBeVisible()
  await expect(page.getByTestId('class-select-strategist')).toBeVisible()
  await expect(page.getByTestId('class-select-shadow')).toHaveCount(0)

  await page.getByTestId('class-select-strategist').click()
  await expect(page.getByTestId('lobby-shell')).toBeVisible()
  await expect(page.getByTestId('lobby-profile-panel')).toBeVisible()
  await expect(page.getByTestId('lobby-room-panel')).toBeVisible()
  await expect(page.getByTestId('lobby-friend-slot-left')).toBeVisible()
  await expect(page.getByTestId('lobby-friend-slot-right')).toBeVisible()
  await expect(page.getByRole('button', { name: /играть/i })).toBeVisible()

  await page.getByRole('button', { name: /играть/i }).click()
  await expect(page.getByRole('heading', { name: /versus/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /battle board/i })).toBeVisible()

  await page.goto('/profile')
  await expect(page.getByTestId('profile-progression-shell')).toBeVisible()
})

test('the lobby keeps the dark premium shell and hides old dashboard panels', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('class-select-link').click()
  await page.getByTestId('class-select-warrior').click()

  await expect(page.getByTestId('lobby-stage-shell')).toBeVisible()
  await expect(page.getByText('Session Setup')).toHaveCount(0)
  await expect(page.getByText('Daily Quests')).toHaveCount(0)
})
