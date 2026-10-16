import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, test } from './fixtures'

// These run against the real Lumen server with the test-only provider (see playwright.config.ts).
// They verify the streaming pipeline, context handling, rendering and safety, not model quality.

test('streams an answer, keeps follow-up context, and shows the validated visual', async ({ page }) => {
  await page.goto('/tutor')
  await expect(page.locator('.tutor-status')).toHaveText('Test provider, not AI')
  const input = page.getByLabel('Your question')
  await input.fill('How does blood move through the heart?')
  await input.press('Enter')
  const answer = page.locator('.msg--assistant').last()
  await expect(answer).toContainText('Understand the question')
  await expect(answer).toContainText('This is turn 1 of the conversation.')
  await expect(answer.locator('.msg__meta')).toHaveText('Test provider, not AI')
  // The visual block is removed from the text and rendered by a trusted component.
  await expect(answer).not.toContainText('lumen-visual')
  await expect(page.locator('.tutor__visual .heartviz')).toBeVisible()
  await expect(page.locator('.tutor__visual')).toContainText('Left ventricle.')

  await input.fill('And what about the valves?')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.locator('.msg--assistant').last()).toContainText('This is turn 2 of the conversation.')

  // History persists.
  await page.reload()
  await expect(page.locator('.tutor__chat')).toHaveCount(1)
  await page.locator('.tutor__chat').first().click()
  await expect(page.locator('.msg--user')).toHaveCount(2)
})

test('model output cannot inject markup or unknown components', async ({ page }) => {
  await page.goto('/tutor')
  await page.getByLabel('Your question').fill('show me a script diagram')
  await page.getByLabel('Your question').press('Enter')
  await expect(page.locator('.msg--assistant').last()).toContainText('This is turn 1')
  // The injected diagram's labels arrive as plain text; no img/script elements are created from them.
  expect(await page.locator('.tutor img, .tutor script').count()).toBe(0)
  expect(await page.evaluate(() => (window as unknown as { injected?: boolean }).injected)).toBeUndefined()
})

test('shows an explicit configuration message when the server has no AI key', async ({ page }) => {
  await page.route('**/api/tutor/status', (r) => r.fulfill({ json: { configured: false, provider: 'anthropic', model: null, live: true } }))
  await page.goto('/tutor')
  await expect(page.locator('.tutor-status')).toHaveText('AI not configured')
  await expect(page.getByText('The AI tutor is not configured on this server.')).toBeVisible()
  await page.getByLabel('Your question').fill('What does the left ventricle do?')
  await page.getByLabel('Your question').press('Enter')
  const a = page.locator('.msg--assistant').last()
  await expect(a.locator('.msg__meta')).toHaveText('From saved lessons, not AI')
  await expect(a).toContainText('The human heart')
})

test('errors are shown with a retry, and offline answers come from saved lessons', async ({ page, context }) => {
  await page.route('**/api/tutor', (r) => r.fulfill({ status: 503, json: { error: 'provider_unreachable', message: 'The server could not reach the AI service.' } }))
  await page.goto('/tutor')
  await page.getByLabel('Your question').fill('Explain pointers')
  await page.getByLabel('Your question').press('Enter')
  await expect(page.getByRole('alert')).toContainText('The server could not reach the AI service.')
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  await expect(page.getByLabel('Your question')).toHaveValue('Explain pointers')

  await context.setOffline(true)
  await expect(page.locator('.tutor-status')).toHaveText('Offline: saved lessons only')
  await page.getByLabel('Your question').fill('explain pointers in C')
  await page.getByLabel('Your question').press('Enter')
  await expect(page.locator('.msg--assistant').last().locator('.msg__meta')).toHaveText('From saved lessons, not AI')
  await expect(page.locator('.msg--assistant').last()).toContainText('Pointers and memory in C')
  await context.setOffline(false)
})

test('lesson context and quick actions', async ({ page }) => {
  await page.goto('/learn/heart')
  await page.getByRole('link', { name: 'Ask the tutor about this lesson' }).click()
  await expect(page.locator('.context-chip')).toContainText('The human heart')
  await page.getByRole('button', { name: /Make 6 flashcards/ }).click()
  await expect(page.locator('.msg--user')).toContainText('Make 6 flashcards from the lesson "The human heart".')
  await expect(page.locator('.msg--assistant')).toContainText('This is turn 1')
})

test('no provider secret or SDK reaches the browser bundle', () => {
  const dir = resolve('dist', 'assets') // Playwright runs from apps/web
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const js = readFileSync(join(dir, f), 'utf8')
    // The variable name ANTHROPIC_API_KEY appears in setup instructions; key material, the SDK and the API host may not.
    expect(js, f).not.toMatch(/sk-ant-|x-api-key|api\.anthropic\.com|@anthropic-ai/)
  }
})
