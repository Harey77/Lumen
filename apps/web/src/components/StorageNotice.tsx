import { Link } from 'wouter'
import { setPrefs, usePrefs } from '../lib/prefs'

/** Informational, not a consent banner: Lumen uses only essential, on-device storage (D-013). */
export function StorageNotice() {
  const { noticeSeen } = usePrefs()
  if (noticeSeen) return null
  return (
    <section className="storage-notice" aria-labelledby="storage-notice-title">
      <h2 id="storage-notice-title" className="storage-notice__title">
        Kept on this device
      </h2>
      <p>
        Lumen saves your lesson progress, quiz results, notes and preferences in this browser. No cookies and no tracking. Only questions you send to the AI tutor leave this device.{' '}
        <Link href="/settings#storage">See what is stored</Link>
      </p>
      <button type="button" className="btn btn--small" onClick={() => setPrefs({ noticeSeen: true })}>
        Understood
      </button>
    </section>
  )
}
