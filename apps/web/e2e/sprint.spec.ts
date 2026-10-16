import { expect, test } from './fixtures'

test('login: says exactly what is missing when accounts are not configured, and never fakes success', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Log in' })).toBeVisible()
  await expect(page.getByText('Sign-in is unavailable.')).toBeVisible()
  await expect(page.getByText(/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeDisabled()
  // Without accounts, learner pages stay usable locally instead of locking everyone out.
  await page.goto('/my-learning')
  await expect(page.getByRole('heading', { level: 1, name: 'My Learning' })).toBeVisible()
})

test('password field toggles visibility without losing the value', async ({ page }) => {
  await page.goto('/signup')
  const pw = page.getByLabel('Password', { exact: true })
  await pw.fill('secret123')
  await expect(pw).toHaveAttribute('type', 'password')
  const toggle = page.getByRole('button', { name: 'Show password' }).first()
  await toggle.click()
  await expect(pw).toHaveAttribute('type', 'text')
  await expect(pw).toHaveValue('secret123')
  await expect(page.getByRole('button', { name: 'Hide password' }).first()).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Hide password' }).first().click()
  await expect(pw).toHaveAttribute('type', 'password')
})

test('header offers Log in; forgot-password and reset pages exist', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Log in' }).first().click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Reset password' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to log in' }).click()
  await page.getByRole('link', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sign up' })).toBeVisible()
})

test('every tutor answer has Listen; playback reports honestly and stops on navigation', async ({ page }) => {
  await page.goto('/tutor')
  await page.getByLabel('Your question').fill('Explain the heart chambers')
  await page.getByLabel('Your question').press('Enter')
  const answer = page.locator('.msg--assistant').last()
  await expect(answer).toContainText('This is turn 1')
  const listen = answer.getByRole('button', { name: 'Listen' })
  await expect(listen).toBeVisible()
  await listen.click()
  // Headless Chromium may have no voices: either it really starts, or it says it could not.
  await expect(answer.locator('.listen__status')).toHaveText(/Starting…|Reading aloud…|could not start|stopped|not supported/, { timeout: 6000 })
  await expect(answer.locator('.listen__status')).toHaveText(/Reading aloud…|could not start|stopped|not supported/, { timeout: 6000 })
  await page.getByRole('link', { name: 'Home' }).first().click()
  expect(await page.evaluate(() => speechSynthesis.speaking)).toBe(false)
})
