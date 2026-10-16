import { useEffect, useState } from 'react'
import { Icon } from './Icon'

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback for browsers without the async Clipboard API.
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  if (!ok) throw new Error('copy command refused')
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 2500)
    return () => clearTimeout(t)
  }, [state])

  return (
    <span className="copy">
      <button
        type="button"
        className="btn btn--quiet btn--small"
        onClick={() => copyText(text).then(() => setState('done'), () => setState('failed'))}
        aria-label={label}
      >
        <Icon name={state === 'done' ? 'check' : 'copy'} size={16} />
        <span aria-hidden="true">{state === 'done' ? 'Copied' : 'Copy'}</span>
      </button>
      <span className="copy__status" role="status">
        {state === 'done' ? 'Copied to clipboard' : state === 'failed' ? 'Copy failed. Select the text and copy it by hand.' : ''}
      </span>
    </span>
  )
}
