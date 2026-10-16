import type { Flow, PartId } from '../content/types'

export type ViewCommand = { type: 'rotate-left' | 'rotate-right' | 'zoom-in' | 'zoom-out' | 'reset'; n: number }

/** Shared contract for both renderers (3D and the 2D diagram tier), so one timeline drives either. */
export interface StageProps {
  stepIndex: number
  highlight: PartId | null
  labels: PartId[]
  outerVisible: boolean
  flow: Flow | undefined
  /** Camera moves and particles allowed (false under reduced motion). */
  animate: boolean
  replayKey: number
  command: ViewCommand | null
  partNames: Record<PartId, string>
  onPick: (part: PartId) => void
  onNotice?: (text: string) => void
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
