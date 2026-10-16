import { expect, test } from './fixtures'

test('anatomy: the 3D heart renders, parts are selectable, and the tour follows the blood', async ({ page }) => {
  await page.goto('/learn/heart')
  const viz = page.locator('.heartviz')
  await expect(viz.locator('canvas.heart3d__canvas')).toBeVisible()
  await viz.getByRole('button', { name: 'Left ventricle', exact: true }).click()
  await expect(viz.locator('.heartviz__info')).toContainText('The strongest chamber')
  await viz.getByRole('button', { name: 'Start the guided tour' }).click()
  await expect(viz.locator('.heartviz__info')).toContainText('Step 1 of 8')
  await viz.getByRole('button', { name: 'Next step' }).click()
  await expect(viz.locator('.heartviz__info')).toContainText('right atrium')
  await viz.getByRole('button', { name: 'Labels' }).click()
  await expect(viz.getByRole('button', { name: 'Labels' })).toHaveAttribute('aria-pressed', 'false')
})

test.describe('without WebGL', () => {
  test('the heart falls back to an accurate 2D diagram with the same parts', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type.startsWith('webgl')) return null
        return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest)
      } as typeof orig
    })
    await page.goto('/learn/heart')
    await expect(page.locator('.heartviz svg.heart2d')).toBeVisible()
    await expect(page.getByText('3D is not available here')).toBeVisible()
    await page.locator('.heartviz').getByRole('button', { name: 'Aorta' }).click()
    await expect(page.locator('.heartviz__info')).toContainText('largest artery')
  })
})

test('botany: the photosynthesis model reports the real limiting factor', async ({ page }) => {
  await page.goto('/learn/photosynthesis')
  const viz = page.locator('.psviz')
  await viz.getByLabel(/Carbon dioxide/).fill('10')
  await expect(viz).toContainText('Limiting factor: carbon dioxide')
  await expect(viz).toContainText('Relative rate: 10%')
  await viz.getByLabel(/Carbon dioxide/).fill('100')
  await viz.getByLabel(/^Light/).fill('30')
  await expect(viz).toContainText('Limiting factor: light')
  await page.locator('.pcviz').getByRole('button', { name: 'Chloroplasts' }).click()
  await expect(page.locator('.pcviz')).toContainText('Animal cells do not have this.')
})

test('programming: box model recalculates the real rendered width', async ({ page }) => {
  await page.goto('/learn/css-box-model')
  const viz = page.locator('.boxviz')
  await viz.getByLabel(/^width/).fill('200')
  await viz.getByLabel(/^padding/).fill('20')
  await viz.getByLabel(/^border/).fill('2')
  await expect(viz.locator('.boxviz__sum')).toContainText('Rendered width: 244px')
  // The preview animates between sizes, so wait for the settled width of the real element.
  await expect.poll(() => viz.locator('.boxviz__el').evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBe(244)
  await viz.getByRole('button', { name: 'border-box' }).click()
  await expect(viz.locator('.boxviz__sum')).toContainText('Rendered width: 200px')
})

test('programming: Python trace steps line by line', async ({ page }) => {
  await page.goto('/learn/python-variables')
  const viz = page.locator('.trace')
  await expect(viz).toContainText('not executed in your browser')
  for (let i = 0; i < 5; i++) await viz.getByRole('button', { name: 'Next step' }).click()
  await expect(viz.locator('.trace__note')).toContainText('append changes the list in place')
  await expect(viz.locator('.trace__code li[aria-current="step"]')).toHaveText('b.append(3)')
})

test('JavaScript playground runs code in a sandbox and stops infinite loops', async ({ page }) => {
  await page.goto('/learn/js-closures')
  const pg = page.locator('.playground')
  await pg.getByRole('button', { name: 'Run' }).click()
  await expect(pg.locator('.playground__out')).toContainText('[3,3,3]')
  await pg.getByLabel('Code').fill('while (true) {}')
  await pg.getByRole('button', { name: 'Run' }).click()
  await expect(pg.locator('.playground__out')).toContainText('Stopped after 5 seconds', { timeout: 10_000 })
  // The page stayed responsive the whole time.
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible()
  // Sandboxed code cannot reach Lumen's storage.
  await pg.getByLabel('Code').fill('try { console.log(String(localStorage.length)) } catch (e) { console.log("blocked: " + e.name) }')
  await pg.getByRole('button', { name: 'Run' }).click()
  await expect(pg.locator('.playground__out')).toContainText(/blocked|is not defined/)
})
