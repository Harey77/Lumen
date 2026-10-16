import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/prefs'
import { createHeartScene, type HeartApi, type HeartPart } from './heartScene'

export default function Heart3D(p: {
  highlight: HeartPart | null
  labels: boolean
  flow: boolean
  command: { c: 'left' | 'right' | 'in' | 'out' | 'reset'; n: number } | null
  onPick: (part: HeartPart) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const api = useRef<HeartApi | null>(null)
  const pick = useRef(p.onPick)
  const reduced = useReducedMotion()
  useEffect(() => {
    pick.current = p.onPick
  })

  useEffect(() => {
    api.current = createHeartScene(host.current!, labels.current!, (part) => pick.current(part), !reduced)
    return () => {
      api.current?.dispose()
      api.current = null
    }
  }, [reduced])

  const { highlight, labels: showLabels, flow, command } = p
  useEffect(() => {
    api.current?.update({ highlight, labels: showLabels, flow })
  }, [highlight, showLabels, flow, reduced])
  useEffect(() => {
    if (command) api.current?.command(command.c)
  }, [command])

  return (
    <div className="heart3d" ref={host}>
      <div className="stage-labels" ref={labels} aria-hidden="true" />
    </div>
  )
}
