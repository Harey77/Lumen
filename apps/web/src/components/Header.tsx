import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'wouter'
import { Icon } from './Icon'
import { setTheme, useTheme } from '../lib/prefs'
import { AccountMenu } from '../auth/AuthPages'

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/learn', label: 'Learn' },
  { href: '/tutor', label: 'Tutor' },
  { href: '/practice', label: 'Practice' },
  { href: '/my-learning', label: 'My Learning' },
]

const onlineSub = (cb: () => void) => {
  addEventListener('online', cb)
  addEventListener('offline', cb)
  return () => {
    removeEventListener('online', cb)
    removeEventListener('offline', cb)
  }
}
export const useOnline = () => useSyncExternalStore(onlineSub, () => navigator.onLine)

function isCurrent(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href)
}

function NavLinks({ onNavigate, narrow }: { onNavigate?: () => void; narrow?: boolean }) {
  const [path] = useLocation()
  return (
    <ul className="nav__list">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link href={n.href} className="nav__link" aria-current={isCurrent(path, n.href) ? 'page' : undefined} onClick={onNavigate}>
            {n.label}
          </Link>
        </li>
      ))}
      {narrow && (
        <li className="settings-link--narrow">
          <Link href="/settings" className="nav__link" aria-current={isCurrent(path, '/settings') ? 'page' : undefined} onClick={onNavigate}>
            Settings
          </Link>
        </li>
      )}
    </ul>
  )
}

export function ThemeToggle() {
  const { resolved } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}

export function Header() {
  const [path] = useLocation()
  // The menu is open for the page it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === path
  const setOpen = (v: boolean) => setOpenOn(v ? path : null)
  const online = useOnline()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOn(null)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link href="/" className="brand" aria-label="Lumen, home">
          <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M17 3c6 .5 12 5 12 12 0 7-4 13.5-12 14C9 29.5 3 24 3.5 16 4 8.5 10 2.5 17 3z" />
            <circle cx="18" cy="12" r="2" className="brand__star" />
          </svg>
          <span className="brand__word">Lumen</span>
        </Link>

        <nav className="nav nav--wide" aria-label="Main">
          <NavLinks />
        </nav>

        <div className="site-header__tools">
          {!online && (
            <span className="status-pill" role="status">
              Offline
            </span>
          )}
          <Link href="/search" className="icon-btn" aria-label="Search lessons and notes" title="Search">
            <Icon name="search" />
          </Link>
          <span className="account-slot">
            <AccountMenu />
          </span>
          <ThemeToggle />
          <Link href="/settings" className="icon-btn settings-link" aria-label="Settings" title="Settings">
            <Icon name="gear" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} size={18} />
            <span>{open ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>
      <div id="mobile-nav" ref={panelRef} className="nav nav--narrow" hidden={!open}>
        <nav aria-label="Main">
          <NavLinks narrow onNavigate={() => setOpen(false)} />
          <div className="account-narrow">
            <AccountMenu onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      </div>
    </header>
  )
}
