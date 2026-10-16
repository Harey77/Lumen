import { chip, expect, startLesson, test } from './fixtures'

test('core journey: mode switch keeps the step, recall feedback, progress survives reload', async ({ page }) => {
  await page.goto('/learn/mitochondrion')
  await page.locator('.chooser__option', { hasText: 'Read and watch' }).click()
  const title = page.locator('.explainer__title')
  await expect(title).toHaveText('Cell context')

  for (const t of ['Outer membrane', 'Intermembrane space', 'Cristae']) {
    await page.getByRole('button', { name: 'Next step' }).click()
    await expect(title).toHaveText(t)
  }
  await expect(page).toHaveURL(/step=4/)

  // Switching mode keeps the current step (PRD 6.2).
  await page.getByRole('button', { name: 'Listen and watch' }).click()
  await expect(title).toHaveText('Cristae')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await page.getByRole('button', { name: 'Read and watch' }).click()
  await expect(title).toHaveText('Cristae')

  // Recall: wrong answer names the tapped part, right answer explains why.
  await chip(page, 'Outer membrane').click()
  await expect(page.locator('.recall__feedback')).toContainText('That is the outer membrane')
  await chip(page, 'Inner membrane and cristae').click()
  await expect(page.locator('.recall__feedback')).toContainText('Yes.')
  await expect(page.locator('#part-detail-title')).toHaveText('Inner membrane and cristae')

  await page.reload()
  await expect(title).toHaveText('Cristae')
  await expect(page.getByRole('button', { name: 'Read and watch' })).toHaveAttribute('aria-pressed', 'true')

  // Skills are derived from what was stored.
  await page.goto('/skills')
  const row = (name: string) => page.locator('tbody tr', { has: page.getByRole('rowheader', { name }) })
  await expect(row('Inner membrane and cristae')).toContainText('Checked in app')
  await expect(row('Outer membrane')).toContainText('Explored')
  await expect(row('Matrix')).toContainText('Not yet explored')

  // The missed check landed in the review list.
  await page.goto('/library')
  await expect(page.getByRole('link', { name: 'Step 4. Cristae' })).toBeVisible()
})

test('adaptation: three misses simplify within 2 s, say why, and revert in one tap', async ({ page }) => {
  await startLesson(page, 'Read and watch', 6)
  await expect(page.locator('.explainer__title')).toHaveText('ATP synthase')
  for (const p of ['Matrix', 'Outer membrane']) await chip(page, p).click()
  await expect(page.locator('.adapt__notice')).toHaveCount(0)
  const t0 = Date.now()
  await chip(page, 'Electron transport chain').click()
  await expect(page.locator('.adapt__notice')).toContainText('3 missed taps in a row on this step', { timeout: 2000 })
  expect(Date.now() - t0).toBeLessThan(2000)
  await expect(page.getByText('Idea 1 of 3')).toBeVisible()
  await expect(page.locator('.explainer')).toHaveAttribute('data-load', 'high')

  await page.getByRole('button', { name: 'Back to full view' }).click()
  await expect(page.locator('.adapt__notice')).toHaveCount(0)
  await expect(page.locator('.explainer')).toHaveAttribute('data-load', 'low')
  await expect(page.getByRole('heading', { name: 'Tap the part where ATP is made.' })).toBeVisible()
})

test('adaptation can be switched off in Settings', async ({ page }) => {
  await page.goto('/settings')
  await page.getByLabel(/Adapt lessons when I seem to struggle/).uncheck()
  await startLesson(page, 'Read and watch', 6)
  for (const p of ['Matrix', 'Outer membrane', 'Electron transport chain']) await chip(page, p).click()
  await expect(page.locator('.explainer')).toHaveAttribute('data-load', 'low')
})

test('guided mode narrates with captions, and says so honestly when speech is unavailable', async ({ page }) => {
  await startLesson(page, 'Listen and watch')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('.caption')).toHaveText('Inside most of your cells are mitochondria.')
  // Headless Chromium has no voices: the watchdog falls back to reading-paced captions.
  await expect(page.locator('.guided .inline-status')).toContainText(/captions are paced for reading|Narrating/, { timeout: 5000 })
  await expect(page.locator('.caption')).not.toHaveText('Inside most of your cells are mitochondria.', { timeout: 8000 })
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText('Paused.')).toBeVisible()
  // Sound and captions cannot both be off in Guided mode.
  await page.getByLabel('Sound').uncheck()
  // Turning captions off too switches to Reader, which removes the checkbox; click, do not uncheck.
  await page.getByLabel('Captions').click()
  await expect(page.getByRole('button', { name: 'Read and watch' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Guided mode needs sound or captions')).toBeVisible()
})

test('recap quiz hides labels and offers to keep weak steps', async ({ page }) => {
  await startLesson(page, 'Read and watch', 8)
  await page.getByRole('button', { name: 'Start the recap quiz' }).click()
  await expect(page.locator('.stage-label:not([hidden])')).toHaveCount(0)
  const answers = ['Outer membrane', 'Intermembrane space', 'Inner membrane and cristae', 'Electron transport chain', 'ATP synthase']
  for (const a of answers) await chip(page, a).click()
  // Miss the last one twice.
  await chip(page, 'Outer membrane').click()
  await chip(page, 'Outer membrane').click()
  await expect(page.getByRole('heading', { name: 'Quiz finished' })).toBeVisible()
  await expect(page.getByText('Worth another look: Matrix.')).toBeVisible()
  await page.getByRole('button', { name: 'Keep this for review' }).click()
  await expect(page.getByText('Added to your review list.')).toBeVisible()
})
