import AxeBuilder from '@axe-core/playwright'
import { expect, startLesson, test } from './fixtures'

const ROUTES = ['/', '/explore', '/learn', '/learn/binary-search', '/learn/big-o', '/learn/js-closures', '/practice', '/my-learning', '/map', '/library', '/perspectives', '/skills', '/settings', '/search?q=atp', '/learn/mitochondrion', '/tutor', '/learn/heart', '/learn/photosynthesis', '/learn/css-box-model', '/learn/html-structure', '/learn/python-variables', '/learn/c-pointers', '/learn/csharp-types', '/learn/java-objects']

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme })
    for (const route of ROUTES) {
      test(`no WCAG A/AA violations on ${route}`, async ({ page }) => {
        await page.goto(route)
        await expect(page.locator('h1')).toBeVisible()
        // Check the settled page: wait for entrance animations (finite ones) to finish.
        await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline && a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)))
        // Sandboxed playground frames hold learner-authored content and allow no scripts, so axe cannot enter them.
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('iframe[sandbox]').options({ iframes: false }).analyze()
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([])
      })
    }
    test('no violations inside the explainer, with a part open and a check answered', async ({ page }) => {
      await startLesson(page, 'Read and watch', 4)
      await page.locator('.tray .chip', { hasText: 'Matrix' }).click()
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([])
    })
  })
}
