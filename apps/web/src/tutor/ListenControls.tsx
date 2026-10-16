import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { pauseSpeech, playSpeech, resumeSpeech, speakable, speechSupported, stopSpeech, useSpeech } from './speech'

/** Listen / Pause / Resume / Stop for one answer. Only one answer speaks at a time. */
export function ListenControls({ id, markdown }: { id: string; markdown: string }) {
  const s = useSpeech()
  const [withCode, setWithCode] = useState(false)
  const mine = s.id === id
  const hasCode = /```(?!lumen-visual)/.test(markdown)
  const supported = speechSupported()
  const activeRef = useRef(mine)
  useEffect(() => {
    activeRef.current = mine
  }, [mine])

  // Clean up speech if this answer component unmounts while actively speaking
  useEffect(() => {
    return () => {
      if (activeRef.current) stopSpeech()
    }
  }, [])

  const onToggleCode = (readCode: boolean) => {
    setWithCode(readCode)
    if (mine && (s.status === 'speaking' || s.status === 'paused')) {
      playSpeech(id, speakable(markdown, readCode))
    }
  }

  return (
    <div className="listen" role="group" aria-label="Listen to this answer">
      {!mine || s.status === 'idle' || s.status === 'error' ? (
        <button type="button" className="btn btn--small" onClick={() => playSpeech(id, speakable(markdown, withCode))} disabled={!supported}>
          <Icon name="speaker" size={16} />
          Listen
        </button>
      ) : (
        <>
          {s.status === 'paused' ? (
            <button type="button" className="btn btn--small" onClick={resumeSpeech}>
              <Icon name="play" size={16} />
              Resume
            </button>
          ) : (
            <button type="button" className="btn btn--small" onClick={pauseSpeech} disabled={s.status === 'starting'}>
              <Icon name="pause" size={16} />
              Pause
            </button>
          )}
          <button type="button" className="btn btn--small btn--quiet" onClick={stopSpeech}>
            <Icon name="close" size={16} />
            Stop
          </button>
        </>
      )}
      {hasCode && (
        <label className="check check--small">
          <input type="checkbox" checked={withCode} onChange={(e) => onToggleCode(e.target.checked)} />
          <span>Read code too</span>
        </label>
      )}
      <span className="listen__status" role="status">
        {!supported
          ? 'Reading aloud is not supported in this browser.'
          : mine && s.status === 'starting'
            ? 'Starting…'
            : mine && s.status === 'speaking'
              ? 'Reading aloud…'
              : mine && s.status === 'paused'
                ? 'Paused.'
                : mine && s.status === 'error'
                  ? s.error
                  : ''}
      </span>
    </div>
  )
}
