import { test as base, expect, type Page } from '@playwright/test'

/** Most tests start with the storage notice already acknowledged, so it does not cover controls. */
export const test = base.extend<{ fresh: boolean }>({
  fresh: [false, { option: true }],
  page: async ({ page, fresh }, use) => {
    if (!fresh) {
      await page.addInitScript(() => {
        if (!localStorage.getItem('lumen.prefs')) localStorage.setItem('lumen.prefs', JSON.stringify({ noticeSeen: true }))
      })
    }
    await use(page)
  },
})
export { expect }

export async function startLesson(page: Page, mode: 'Read and watch' | 'Listen and watch' = 'Read and watch', step?: number) {
  await page.goto(step ? `/learn/mitochondrion?step=${step}` : '/learn/mitochondrion')
  await page.locator('.chooser__option', { hasText: mode }).click()
  await expect(page.locator('.explainer__title')).toBeVisible()
}

export const chip = (page: Page, name: string) => page.locator('.tray .chip', { hasText: new RegExp(`^${name}$`) })
