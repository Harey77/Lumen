import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useReducedMotion } from '../lib/prefs'

/** Reading progress for long pages only. Decorative to assistive tech: the page itself is the content. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${p})`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
    }
  }, [])
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={bar} className="scroll-progress__bar" data-testid="scroll-progress" />
    </div>
  )
}

export function BackToTop({ threshold = 600 }: { threshold?: number }) {
  const [show, setShow] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    const onScroll = () => setShow(scrollY > threshold)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [threshold])
  return (
    <button
      type="button"
      className="back-to-top"
      data-visible={show}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => {
        scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
        document.getElementById('main')?.focus({ preventScroll: true })
      }}
    >
      <Icon name="arrowUp" size={18} />
      <span>Back to top</span>
    </button>
  )
}
