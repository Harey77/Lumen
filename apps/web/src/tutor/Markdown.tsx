import type { ReactNode } from 'react'
import { CodeBlock } from '../learn/widgets'

/**
 * A deliberately small Markdown renderer that builds React elements from text.
 * It never uses innerHTML, so AI output cannot inject markup or scripts; links are not rendered as anchors.
 */

function inline(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let n = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('`')) out.push(<code key={`${key}-${n++}`}>{t.slice(1, -1)}</code>)
    else if (t.startsWith('**')) out.push(<strong key={`${key}-${n++}`}>{t.slice(2, -2)}</strong>)
    else out.push(<em key={`${key}-${n++}`}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export function Markdown({ text, onRunCode }: { text: string; onRunCode?: (lang: string, code: string) => void }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]!
    const fence = /^```(\w[\w#+-]*)?\s*$/.exec(line)
    if (fence) {
      const lang = (fence[1] ?? '').toLowerCase()
      const body: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) body.push(lines[i++]!)
      i++
      const code = body.join('\n')
      blocks.push(
        <div key={k++} className="md-code">
          <CodeBlock code={code} lang={lang || 'code'} />
          {onRunCode && ['javascript', 'js', 'html', 'css'].includes(lang) && (
            <button type="button" className="btn btn--small" onClick={() => onRunCode(lang, code)}>
              Open in playground
            </button>
          )}
        </div>,
      )
      continue
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      const level = Math.min(4, h[1]!.length + 1)
      const content = inline(h[2]!, `h${k}`)
      blocks.push(level <= 3 ? <h3 key={k++} className="md-h">{content}</h3> : <h4 key={k++} className="md-h4">{content}</h4>)
      i++
      continue
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*([-*]|\d+\.)\s+/, ''))
      const lis = items.map((it, j) => <li key={j}>{inline(it, `l${k}-${j}`)}</li>)
      blocks.push(ordered ? <ol key={k++}>{lis}</ol> : <ul key={k++}>{lis}</ul>)
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i]!.trim() && !/^(```|#{1,4}\s|\s*([-*]|\d+\.)\s)/.test(lines[i]!)) para.push(lines[i++]!)
    blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>)
  }
  return <div className="md">{blocks}</div>
}
