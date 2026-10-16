import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { db, patchLesson } from '../lib/db'

/** Records that the lesson was opened, and offers bookmark / mark complete. Both persist in IndexedDB. */
export function LessonActions({ lessonId }: { lessonId: string }) {
  const state = useLiveQuery(() => db.lessons.get(lessonId), [lessonId])
  const [error, setError] = useState(false)

  useEffect(() => {
    patchLesson(lessonId, { lastOpenedAt: Date.now() }).catch(() => setError(true))
  }, [lessonId])

  const toggle = (patch: Parameters<typeof patchLesson>[1]) => patchLesson(lessonId, patch).then(() => setError(false), () => setError(true))
  const done = !!state?.completedAt

  return (
    <div className="lesson-actions">
      <button type="button" className="btn btn--small" aria-pressed={!!state?.bookmarked} onClick={() => toggle({ bookmarked: !state?.bookmarked })}>
        <Icon name="save" size={16} />
        {state?.bookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
      <button type="button" className="btn btn--small" aria-pressed={done} onClick={() => toggle({ completedAt: done ? undefined : Date.now() })}>
        <Icon name="check" size={16} />
        {done ? 'Completed' : 'Mark complete'}
      </button>
      {error && <span className="field__error">Could not save in this browser.</span>}
    </div>
  )
}
