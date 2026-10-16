import { useEffect, useRef } from 'react'
import { createScene, type SceneApi } from './scene'
import type { StageProps } from './stage'

export default function Model3D(p: StageProps) {
  const host = useRef<HTMLDivElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const api = useRef<SceneApi | null>(null)
  const cb = useRef({ onPick: p.onPick, onNotice: p.onNotice })
  useEffect(() => {
    cb.current = { onPick: p.onPick, onNotice: p.onNotice }
  })

  useEffect(() => {
    api.current = createScene(
      host.current!,
      labels.current!,
      p.partNames,
      (part) => cb.current.onPick(part),
      (t) => cb.current.onNotice?.(t),
    )
    return () => {
      api.current?.dispose()
      api.current = null
    }
    // The scene is built once; later prop changes go through update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { stepIndex, highlight, labels: labelList, outerVisible, flow, animate, replayKey, command } = p
  useEffect(() => {
    api.current?.update({ stepIndex, highlight, labels: labelList, outerVisible, flow, animate, replayKey })
  }, [stepIndex, highlight, labelList, outerVisible, flow, animate, replayKey])

  useEffect(() => {
    if (command) api.current?.command(command)
  }, [command])

  return (
    <div className="stage3d" ref={host}>
      <div className="stage-labels" ref={labels} aria-hidden="true" />
    </div>
  )
}
