import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

const answer = async (page: Page, text: string) => {
  await page.locator('.choice', { hasText: text }).click()
  await page.getByRole('button', { name: 'Check answer' }).click()
}
const next = (page: Page) => page.getByRole('button', { name: /Next question|See results/ }).click()

test('home CTAs and domain cards lead to real content; only two domains exist', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ask the tutor' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'AI tutor' })).toBeVisible()
  await page.goto('/')
  await page.getByRole('link', { name: 'Explore the two domains' }).click()
  await expect(page).toHaveURL(/\/explore$/)
  await expect(page.locator('.domain-block')).toHaveCount(2)
  for (const s of ['HTML', 'CSS', 'C', 'C#', 'Java', 'Python', 'JavaScript', 'Human anatomy and physiology', 'Basic and cellular biology', 'Botany and plant biology'])
    await expect(page.getByRole('heading', { level: 3, name: s, exact: true })).toBeVisible()
  await page.getByPlaceholder('Filter lessons').fill('closure')
  await expect(page.locator('.lesson-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Biology', exact: true }).click()
  await expect(page.getByText('No lessons match')).toBeVisible()
  await page.goto('/')
  await page.locator('.domain-card[data-domain="biology"]').click()
  await expect(page.locator('.domain-block')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Biology and life sciences' })).toBeVisible()
})

test('lesson quiz: validation, feedback, adaptive follow-up, score, recommendation, persistence, retry', async ({ page }) => {
  await page.goto('/learn/binary-search')
  await page.getByRole('button', { name: 'Bookmark' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()

  await page.getByRole('button', { name: 'Start the quiz' }).click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Choose an answer first.')).toBeVisible()

  // Q1 wrong: specific reason plus a link back to the section.
  await answer(page, 'It must contain no duplicates')
  await expect(page.locator('.feedback')).toContainText('Not quite.')
  await expect(page.locator('.feedback')).toContainText('Binary search works with duplicates')
  await expect(page.getByRole('link', { name: 'Re-read: Why the data must be sorted' })).toBeVisible()
  await next(page)

  // Q2 wrong: Lumen queues a simpler question on the same concept.
  await expect(page.locator('.quiz__prompt')).toContainText('sorted[mid] = 30')
  await answer(page, 'hi = mid')
  await expect(page.getByText('Next: a simpler question on the same idea.')).toBeVisible()
  await next(page)
  await expect(page.locator('.quiz__prompt')).toContainText('left or the right of 15')
  await answer(page, 'To the right')
  await expect(page.locator('.feedback')).toContainText('Correct.')
  await next(page)

  await answer(page, 'O(log n)')
  await next(page)
  await answer(page, 'The last remaining element is never compared')
  await next(page)
  await answer(page, 'About 20')
  await next(page)

  await expect(page.getByRole('heading', { name: '4 of 6 correct' })).toBeVisible()
  await expect(page.getByText('3 of 5 main questions, plus 1 simpler follow-up question.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nearly there. Revise what you missed.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Revise: Why the data must be sorted' })).toHaveAttribute('href', '/learn/binary-search#the-idea')
  await expect(page.getByText('Result saved to My Learning.')).toBeVisible()

  await page.getByRole('button', { name: 'Retry the quiz' }).click()
  await expect(page.locator('.quiz__prompt')).toContainText('What must be true of an array')

  // Everything survives a reload and shows up in My Learning.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Bookmarked' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/my-learning')
  await expect(page.locator('tbody tr').first()).toContainText('Binary search')
  await expect(page.locator('tbody tr').first()).toContainText('4 / 6')
  await expect(page.getByRole('region', { name: 'Needs revision' })).toContainText('Why the data must be sorted')
  await expect(page.getByRole('region', { name: 'Bookmarks' })).toContainText('Binary search')
  await expect(page.locator('.ml-big')).toContainText('1')

  // The missed questions become a practice set.
  await page.goto('/practice?set=missed')
  await expect(page.getByText('Quiz · 2 questions')).toBeVisible()
})

test('all-correct quiz recommends the next lesson', async ({ page }) => {
  await page.goto('/learn/big-o')
  await page.getByRole('button', { name: 'Start the quiz' }).click()
  for (const a of ['It roughly doubles', 'O(log n)', /^O\(n²\)$/, /^O\(n²\)$/]) {
    await page.locator('.choice', { hasText: a }).first().click()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await next(page)
  }
  await expect(page.getByRole('heading', { name: '4 of 4 correct' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Next lesson: Binary search' })).toBeVisible()
})

test('binary search widget steps through a real search', async ({ page }) => {
  await page.goto('/learn/binary-search')
  await page.getByRole('button', { name: 'Find 8' }).click()
  await page.getByRole('button', { name: 'Run to the end' }).click()
  await expect(page.locator('.bsviz__log li').last()).toContainText('Found 8 at index 1', { timeout: 10000 })
  await expect(page.locator('.bsviz__count')).toContainText('3 comparisons')
})
