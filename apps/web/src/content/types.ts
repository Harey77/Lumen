export type PartId =
  | 'outer-membrane'
  | 'intermembrane-space'
  | 'cristae'
  | 'etc'
  | 'atp-synthase'
  | 'matrix'

export interface Part {
  id: PartId
  name: string
  role: string
  line: string
}

export interface Analogy {
  text: string
  /** Where the analogy stops being true (PRD 3.6). */
  breaks: string
}

export type AnalogyDomain = 'machines' | 'cooking'

export interface RecallCheck {
  prompt: string
  target: PartId
  why: string
}

export type Flow = 'pump' | 'synthase' | 'recap'

export interface Step {
  id: string
  title: string
  /** The part this step explains; null for the context and recap steps. */
  partId: PartId | null
  /** Current part plus neighbours: the labels shown under medium load. */
  focus: PartId[]
  /** Reader mode card: one to three short lines. */
  reader: string[]
  /** Guided mode: spoken one sentence at a time, also the captions. */
  narration: string[]
  /** High-load decomposition: one idea per card. */
  scaffold: string[]
  analogy: Record<AnalogyDomain, Analogy>
  recall?: RecallCheck
  flow?: Flow
}

export interface Source {
  id: string
  citation: string
  url?: string
}

export interface ExplainerModule {
  id: string
  title: string
  question: string
  /** Date the content was last revised by its authors (D-016). */
  revised: string
  reviewer: string | null
  simplification: string
  sources: Source[]
  parts: Record<PartId, Part>
  steps: Step[]
  recapQuiz: PartId[]
}
