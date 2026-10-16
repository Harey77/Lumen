import { chip, expect, startLesson, test } from './fixtures'

test('the core journey works offline after one online visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // The first page load is not yet controlled; reload so the service worker serves everything.
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.goto('/learn/mitochondrion')
  await expect(page.locator('.status-pill')).toHaveText('Offline')
  await page.locator('.chooser__option', { hasText: 'Read and watch' }).click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.locator('.explainer__title')).toHaveText('Outer membrane')
  // The 3D chunk and fonts came from the cache too.
  await expect(page.locator('canvas.stage3d__canvas')).toBeVisible()
  await chip(page, 'Matrix').click()
  await expect(page.locator('#part-detail-title')).toHaveText('Matrix')
  await page.reload()
  await expect(page.locator('.explainer__title')).toHaveText('Outer membrane')
  for (const path of ['/explore', '/learn/binary-search', '/practice', '/my-learning', '/skills', '/perspectives', '/library', '/settings', '/search?q=atp']) {
    await page.goto(path)
    await expect(page.locator('h1')).toBeVisible()
  }
  await expect(page.locator('.result').first()).toBeVisible()
  await context.setOffline(false)
})

test('no request leaves the origin during a full journey', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (!['localhost:4173'].includes(u.host) && u.protocol !== 'data:' && u.protocol !== 'blob:') foreign.push(r.url())
  })
  await page.goto('/')
  await startLesson(page)
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Next step' }).click()
  for (const path of ['/explore', '/learn/heart', '/learn/photosynthesis', '/skills', '/perspectives', '/library', '/settings', '/search?q=matrix']) await page.goto(path)
  expect(foreign).toEqual([])
  expect(await page.context().cookies()).toEqual([])
})

test('utm parameters are stripped and never stored', async ({ page }) => {
  await page.goto('/?utm_source=newsletter&ref=1&UTM_campaign=fall&utm_source=dup')
  await expect(page).toHaveURL(/\/\?ref=1$/)
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  expect(stored).not.toContain('newsletter')
  expect(stored).not.toContain('fall')
})
