import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { Icon } from '../components/Icon'
import { db } from '../lib/db'
import { contentDocs, search, type SearchDoc } from '../lib/search'
import { usePageTitle } from './usePageTitle'

const CONTENT = contentDocs()

export function Search() {
  usePageTitle('Search')
  const [, navigate] = useLocation()
  const initial = new URLSearchParams(useSearch()).get('q') ?? ''
  const [q, setQ] = useState(initial)
  const notes = useLiveQuery(() => db.notes.toArray(), [], [])
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLOListElement>(null)

  const docs = useMemo<SearchDoc[]>(
    () => [...CONTENT, ...notes.map((n) => ({ id: `note:${n.id}`, kind: 'Your note' as const, title: n.title, text: n.body, href: '/library' }))],
    [notes],
  )
  const hits = useMemo(() => search(docs, q), [docs, q])

  const update = (v: string) => {
    setQ(v)
    navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search', { replace: true })
  }

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      update('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      list.current?.querySelector('a')?.focus()
    } else if (e.key === 'Enter' && hits[0]) {
      e.preventDefault()
      navigate(hits[0].href)
    }
  }
  const onListKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const links = [...(list.current?.querySelectorAll('a') ?? [])]
    const i = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      links[Math.min(i + 1, links.length - 1)]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (i <= 0) input.current?.focus()
      else links[i - 1]?.focus()
    } else if (e.key === 'Escape') {
      input.current?.focus()
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Search</h1>
        <p className="muted">Searches lesson steps, parts, the perspective scenario, help questions and your notes. Everything is searched on this device, so it works offline.</p>
      </header>
      <form role="search" className="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="visually-hidden">
          Search Lumen
        </label>
        <Icon name="search" />
        <input
          ref={input}
          id="q"
          type="search"
          value={q}
          onChange={(e) => update(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="Try: ATP synthase, cristae, Mitchell"
          autoFocus
          autoComplete="off"
          aria-describedby="search-count"
        />
        {q && (
          <button type="button" className="btn btn--quiet btn--small" onClick={() => (update(''), input.current?.focus())}>
            Clear
          </button>
        )}
      </form>
      <p id="search-count" className="muted" role="status">
        {q.trim() ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}` : ''}
      </p>
      {q.trim() && hits.length === 0 && (
        <p className="empty">
          Nothing matches "{q}". Lumen holds one lesson so far, on the mitochondrion. Try a part name such as matrix or ATP synthase.
        </p>
      )}
      <ol className="results" ref={list} onKeyDown={onListKey}>
        {hits.map((h) => (
          <li key={h.id}>
            <Link href={h.href} className="result">
              <span className="result__kind">{h.kind}</span>
              <span className="result__title">{h.title}</span>
              <span className="result__snippet">{h.snippet}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
