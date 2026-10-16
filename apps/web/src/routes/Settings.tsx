import { useEffect, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { BackToTop } from '../components/ScrollAids'
import { FaqList, formatDate } from '../components/Small'
import { faqs } from '../content/faq'
import { mitochondrion } from '../content/mitochondrion'
import { clearEverything, exportRecord, resetLearning } from '../lib/db'
import { clearPrefs, setPrefs, setTheme, usePrefs, useTheme, type Prefs, type ThemeChoice } from '../lib/prefs'
import { clearSignals, useLoad } from '../load-engine/store'
import { THRESHOLDS, WEIGHTS } from '../load-engine/load-engine'
import { Link } from 'wouter'
import { authConfigured, signOut, useAuth } from '../auth/auth'
import { usePageTitle } from './usePageTitle'

declare const __BUILD_TIME__: string

function Choice<T extends string>({ name, legend, value, options, onChange }: { name: string; legend: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <fieldset className="radios radios--inline">
      <legend>{legend}</legend>
      {options.map(([v, label]) => (
        <label key={v} className="radio">
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  )
}

function useOfflineReady() {
  const [state, setState] = useState<'checking' | 'ready' | 'not-ready' | 'unsupported'>(() => ('serviceWorker' in navigator ? 'checking' : 'unsupported'))
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let alive = true
    navigator.serviceWorker.getRegistration().then((r) => alive && setState(r?.active ? 'ready' : 'not-ready'))
    return () => {
      alive = false
    }
  }, [])
  return state
}

function useStorageEstimate(refresh: number) {
  const [est, setEst] = useState<{ usage?: number; persisted?: boolean } | null>(null)
  useEffect(() => {
    let alive = true
    Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()])
      .then(([e, p]) => alive && setEst({ usage: e?.usage, persisted: p }))
      .catch(() => alive && setEst({}))
    return () => {
      alive = false
    }
  }, [refresh])
  return est
}

export function Settings() {
  usePageTitle('Settings')
  const prefs = usePrefs()
  const { user } = useAuth()
  const { choice } = useTheme()
  const { state: load, signals, level } = useLoad()
  const offline = useOfflineReady()
  const [refresh, setRefresh] = useState(0)
  const est = useStorageEstimate(refresh)
  const [confirm, setConfirm] = useState<null | 'progress' | 'all'>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Honour #anchors after the route renders (sticky header offset comes from scroll-padding).
    const el = location.hash && document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView()
  }, [])

  const doExport = async () => {
    try {
      const data = await exportRecord()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `lumen-record-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage(`Exported ${data.events.length} answers, ${data.notes.length} notes and your progress as a JSON file.`)
    } catch {
      setMessage('Export failed: this browser would not read the local record.')
    }
  }

  const set = (p: Partial<Prefs>) => setPrefs(p)
  const usageText = est?.usage !== undefined ? `about ${(est.usage / 1024 / 1024).toFixed(1)} MB in use by Lumen in this browser` : 'size not reported by this browser'

  return (
    <div className="page page--reading">
      <header className="page__head">
        <h1 className="display display--small">Settings</h1>
        <p className="lead">Every switch here changes how Lumen behaves on this device. Nothing is sent anywhere.</p>
      </header>

      <section className="section" aria-labelledby="appearance">
        <h2 id="appearance" className="section-title">
          Appearance and motion
        </h2>
        <Choice<ThemeChoice> name="theme" legend="Theme" value={choice} options={[['system', 'Match this device'], ['light', 'Paper (light)'], ['dark', 'Night (dark)']]} onChange={setTheme} />
        <Choice name="motion" legend="Motion" value={prefs.motion} options={[['system', 'Match this device'], ['reduce', 'Reduce motion']]} onChange={(motion) => set({ motion })} />
      </section>

      <section className="section" aria-labelledby="learning-h" id="learning">
        <h2 id="learning-h" className="section-title">
          Learning
        </h2>
        <label className="check check--block">
          <input type="checkbox" checked={prefs.adaptation} onChange={(e) => set({ adaptation: e.target.checked })} />
          <span>
            <strong>Adapt lessons when I seem to struggle</strong>
            <span className="muted"> Currently {prefs.adaptation ? `on, level ${level}` : 'off'}.</span>
          </span>
        </label>
        <details className="model">
          <summary>How adaptation decides</summary>
          <p>
            Inside a lesson, each signal adds points: missed recall tap {WEIGHTS.miss}, stepping back {WEIGHTS.back}, replay {WEIGHTS.replay}, a pause over 45 seconds {WEIGHTS.hesitate}. Points from the last 3 minutes are added up. {THRESHOLDS.medium} or more lightens the lesson; {THRESHOLDS.high} or more simplifies it. Three missed taps in a row on one step simplify it at once. Otherwise the level changes at most once a minute.
          </p>
          <p>
            This session: {signals.length} signals recorded{load.reason ? `; last change because of ${load.reason}` : ''}. They live in memory only and vanish when you close the tab.
          </p>
          <button type="button" className="btn btn--small" onClick={clearSignals} disabled={signals.length === 0}>
            Forget this session's signals
          </button>
        </details>
        <Choice name="analogy" legend="Analogies drawn from" value={prefs.analogy} options={[['machines', 'Power and machines'], ['cooking', 'Cooking']]} onChange={(analogy) => set({ analogy })} />
        <Choice name="tier" legend="Explainer model" value={prefs.tier} options={[['auto', '3D when available'], ['2d', 'Flat diagram (lighter, less battery)']]} onChange={(tier) => set({ tier })} />
        <label className="field field--inline">
          <span>Narration speed</span>
          <select value={prefs.rate} onChange={(e) => set({ rate: Number(e.target.value) })}>
            <option value={0.8}>0.8x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
          </select>
        </label>
      </section>

      <section className="section" aria-labelledby="storage-h" id="storage">
        <h2 id="storage-h" className="section-title">
          Storage and privacy
        </h2>
        <dl className="facts facts--stack">
          <div>
            <dt>Preferences</dt>
            <dd>Theme, motion, analogy and narration choices, in this browser's local storage.</dd>
          </div>
          <div>
            <dt>Learning record</dt>
            <dd>Lesson position, recall answers, review list, notes and your Perspectives answers, in IndexedDB. Not encrypted: anyone using this browser profile can read it.</dd>
          </div>
          <div>
            <dt>Offline copy</dt>
            <dd>
              The app's code, fonts and lessons, in the browser cache.{' '}
              {offline === 'ready' && 'This device is ready to work offline.'}
              {offline === 'not-ready' && 'Not ready offline yet. It will be after this page finishes loading once from a server build.'}
              {offline === 'unsupported' && 'This browser cannot keep an offline copy.'}
            </dd>
          </div>
          <div>
            <dt>Sent elsewhere</dt>
            <dd>Only questions you send to the AI tutor, together with that conversation, go to Lumen's server and on to the AI provider. Nothing else: no cookies, no analytics, no account. Campaign tags in links are removed and never saved.</dd>
          </div>
          <div>
            <dt>Space used</dt>
            <dd>
              {est ? usageText : 'Checking…'}
              {est?.persisted !== undefined && (est.persisted ? '. The browser will keep it even when space runs low.' : '. The browser may clear it if space runs low.')}
            </dd>
          </div>
        </dl>
        <div className="row">
          {est?.persisted === false && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigator.storage
                  .persist()
                  .then((ok) => {
                    setMessage(ok ? 'The browser agreed to keep Lumen data.' : 'The browser declined. It decides this based on how you use the site.')
                    setRefresh((r) => r + 1)
                  })
                  .catch(() => setMessage('This browser does not support that request.'))
              }
            >
              Ask the browser to keep my data
            </button>
          )}
          <button type="button" className="btn" onClick={doExport}>
            Export my learning record
          </button>
          <button type="button" className="btn" onClick={() => set({ noticeSeen: false })} disabled={!prefs.noticeSeen}>
            Show the storage notice again
          </button>
        </div>
        <div className="row">
          <button type="button" className="btn btn--danger" onClick={() => setConfirm('progress')}>
            Reset learning progress
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirm('all')}>
            Delete everything on this device
          </button>
        </div>
        <p className="inline-status" role="status">
          {message}
        </p>
      </section>

      <section className="section" aria-labelledby="account-h" id="account">
        <h2 id="account-h" className="section-title">
          Account and profile
        </h2>
        {user ? (
          <div>
            <p>
              Signed in as <strong>{user.email}</strong>.
            </p>
            <p className="muted">Your progress is associated with your authenticated session.</p>
            <div className="row">
              <button
                type="button"
                className="btn btn--small"
                onClick={async () => {
                  await signOut()
                  setMessage('Logged out successfully.')
                }}
              >
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="muted">
              {authConfigured
                ? 'You are currently using Lumen as a guest. All progress is saved in this browser.'
                : 'Account sync is not configured on this server. Progress is kept in this browser.'}
            </p>
            {authConfigured && (
              <div className="row">
                <Link href="/login" className="btn btn--small">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn--small btn--accent">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="faq-title" id="faq">
        <h2 id="faq-title" className="section-title">
          Questions
        </h2>
        <FaqList items={faqs} />
      </section>

      <section className="section" aria-labelledby="about">
        <h2 id="about" className="section-title">
          About this build
        </h2>
        <dl className="facts facts--stack">
          <div>
            <dt>Version</dt>
            <dd>Lumen 0.1, a first working slice. Open source licence not yet chosen.</dd>
          </div>
          <div>
            <dt>App built</dt>
            <dd>{formatDate(__BUILD_TIME__)}, from the build timestamp</dd>
          </div>
          <div>
            <dt>Mitochondrion lesson</dt>
            <dd>Content last revised {formatDate(mitochondrion.revised)}, from the module file</dd>
          </div>
          <div>
            <dt>Not in this version</dt>
            <dd>On-device AI models, peer-to-peer sharing, signed skill credentials, dialect narration and code execution for C, C#, Java and Python. They are on the roadmap and are not simulated here.</dd>
          </div>
        </dl>
      </section>

      <ConfirmDialog
        open={confirm === 'progress'}
        title="Reset learning progress?"
        confirmLabel="Reset progress"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await resetLearning()
          clearSignals()
          setMessage('Progress, answers, review list and Perspectives answers were deleted. Notes and preferences were kept.')
          setRefresh((r) => r + 1)
        }}
      >
        <p>Your lesson position, every recall answer, the review list and your Perspectives answers will be deleted from this device. Your skills will start empty. Notes and preferences stay.</p>
        <p>There is no undo. To keep a copy, export your learning record first.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'all'}
        title="Delete everything?"
        confirmLabel="Delete everything"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await clearEverything()
          clearSignals()
          clearPrefs()
          setMessage('Everything Lumen stored on this device was deleted. The offline copy of the app itself remains so it can still open.')
          setRefresh((r) => r + 1)
        }}
      >
        <p>This deletes your progress, answers, notes and preferences from this browser. There is no undo and no copy anywhere else.</p>
      </ConfirmDialog>

      <BackToTop />
    </div>
  )
}
