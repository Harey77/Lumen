import { useState } from 'react'
import type { Faq } from '../content/faq'

/** Shown only while a real promise is pending. Static dots under reduced motion (CSS). */
export function InkLoader({ label }: { label: string }) {
  return (
    <div className="ink-loader" role="status">
      <span className="ink-loader__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  )
}

export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="faq">
      {items.map((f) => {
        const expanded = open === f.id
        return (
          <div key={f.id} className="faq__item" id={`faq-${f.id}`}>
            <h3 className="faq__q">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`faq-a-${f.id}`}
                onClick={() => setOpen(expanded ? null : f.id)}
              >
                <span>{f.q}</span>
                <span className="faq__sign" aria-hidden="true" />
              </button>
            </h3>
            <div id={`faq-a-${f.id}`} className="faq__a" hidden={!expanded}>
              {f.a.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function formatDate(iso: string | number) {
  // Date-only strings parse as UTC midnight; anchor at noon so no time zone shifts the day.
  const d = typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
export function formatDateTime(t: number) {
  return new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
