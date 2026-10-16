import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  EllipseCurve,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  Path,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three'
import type { Flow, PartId } from '../content/types'
import type { ViewCommand } from './stage'

/**
 * Procedural, ink-style mitochondrion (D-008). Simplified and not to scale.
 * Local frame: long axis along Y, open (cut) side facing +Z. The model group is
 * turned so the long axis lies along world X.
 */

export interface SceneInput {
  stepIndex: number
  highlight: PartId | null
  labels: PartId[]
  outerVisible: boolean
  flow: Flow | undefined
  animate: boolean
  replayKey: number
}

export interface SceneApi {
  update(input: SceneInput): void
  command(c: ViewCommand): void
  dispose(): void
}

const R_OUT = 1
const H_OUT = 1.3
const R_IN = 0.86
const H_IN = 1.16
const PLATE_Y = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0]
const PLATE_T = 0.06

const CAMERA: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [0, 0, 24], look: [0, 0, 0] },
  { pos: [1.6, 1.7, 5.4], look: [0, 0, -0.3] },
  { pos: [1.1, 2.0, 3.6], look: [0.6, 0.8, -0.1] },
  { pos: [0, 0.5, 3.8], look: [0, 0, -0.45] },
  { pos: [0.6, 0.6, 3.0], look: [0.2, 0.05, -0.4] },
  { pos: [-0.9, -0.5, 3.0], look: [-0.4, -0.05, -0.4] },
  { pos: [0, 0, 3.1], look: [0, 0, -0.6] },
  { pos: [0, 0.4, 5.6], look: [0, 0, -0.3] },
]

const ANCHOR: Record<PartId, [number, number, number]> = {
  'outer-membrane': [0.71, 0.9, -0.71],
  'intermembrane-space': [0.93, -0.55, 0],
  cristae: [0.3, 0.2, -0.35],
  etc: [-0.35, -0.2 + PLATE_T, -0.3],
  'atp-synthase': [0.35, 0.2 - PLATE_T / 2 - 0.12, -0.55],
  matrix: [0, 0.4, -0.7],
}

function cssColor(name: string) {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'white')
}

function capsuleProfile(r: number, h: number, seg = 14): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * (Math.PI / 2)
    pts.push(new Vector2(Math.max(0.0001, r * Math.sin(t)), -h - r * Math.cos(t)))
  }
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * (Math.PI / 2)
    pts.push(new Vector2(Math.max(0.0001, r * Math.cos(t)), h + r * Math.sin(t)))
  }
  return pts
}

/** 2D capsule outline in the cut plane (x across, y along the long axis). */
function capsuleShapePath(target: Shape | Path, r: number, h: number) {
  target.moveTo(r, -h)
  target.lineTo(r, h)
  target.absarc(0, h, r, 0, Math.PI, false)
  target.lineTo(-r, -h)
  target.absarc(0, -h, r, Math.PI, Math.PI * 2, false)
  return target
}

export function createScene(host: HTMLElement, labelLayer: HTMLElement, names: Record<PartId, string>, onPick: (p: PartId) => void, onNotice: (t: string) => void): SceneApi {
  const ink = cssColor('--night')
  const paper = cssColor('--on-night')
  const accent = cssColor('--night-accent')
  const shade = paper.clone().lerp(ink, 0.18)
  const deep = paper.clone().lerp(ink, 0.32)

  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.domElement.className = 'stage3d__canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.prepend(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.05, 100)
  scene.add(new AmbientLight(0xffffff, 1.6))
  const sun = new DirectionalLight(0xffffff, 1.4)
  sun.position.set(2, 3, 5)
  scene.add(sun)

  const root = new Group()
  const mito = new Group()
  mito.rotation.z = Math.PI / 2
  root.add(mito)
  scene.add(root)

  const disposables: { dispose(): void }[] = []
  const pickables: Mesh[] = []
  const meshesByPart = new Map<PartId, Mesh[]>()
  const linesByPart = new Map<PartId, (LineSegments | Line)[]>()
  const baseColor = new Map<Material, Color>()

  const lineMat = new LineBasicMaterial({ color: ink, transparent: true })
  disposables.push(lineMat)

  function mat(color: Color) {
    const m = new MeshLambertMaterial({ color, side: DoubleSide, transparent: true })
    baseColor.set(m, color.clone())
    disposables.push(m)
    return m
  }
  function add(part: PartId, mesh: Mesh, parent: Object3D = mito, edges = true) {
    mesh.userData.part = part
    parent.add(mesh)
    pickables.push(mesh)
    meshesByPart.set(part, [...(meshesByPart.get(part) ?? []), mesh])
    disposables.push(mesh.geometry)
    if (edges) {
      const e = new LineSegments(new EdgesGeometry(mesh.geometry, 30), lineMat.clone())
      e.position.copy(mesh.position)
      e.rotation.copy(mesh.rotation)
      parent.add(e)
      linesByPart.set(part, [...(linesByPart.get(part) ?? []), e])
      disposables.push(e.geometry, e.material as Material)
    }
    return mesh
  }
  /** Pen strokes along a half shell: longitudes and latitude rings, like hatching. */
  function shellLines(part: PartId, r: number, h: number, longs: number, phiStart: number) {
    const prof = capsuleProfile(r * 1.002, h)
    const make = (pts: Vector3[]) => {
      const l = new Line(new BufferGeometry().setFromPoints(pts), lineMat.clone())
      mito.add(l)
      linesByPart.set(part, [...(linesByPart.get(part) ?? []), l])
      disposables.push(l.geometry, l.material as Material)
    }
    for (let k = 0; k <= longs; k++) {
      const phi = phiStart + (k / longs) * Math.PI
      make(prof.map((p) => new Vector3(p.x * Math.sin(phi), p.y, p.x * Math.cos(phi))))
    }
    for (let y = -h; y <= h + 0.001; y += 0.4) {
      const ring: Vector3[] = []
      for (let i = 0; i <= 24; i++) {
        const phi = phiStart + (i / 24) * Math.PI
        ring.push(new Vector3(r * 1.002 * Math.sin(phi), y, r * 1.002 * Math.cos(phi)))
      }
      make(ring)
    }
  }

  // Outer membrane: back half shell plus a front half that "cuts open" after the cell step.
  const outerMat = mat(paper)
  add('outer-membrane', new Mesh(new LatheGeometry(capsuleProfile(R_OUT, H_OUT), 40, Math.PI / 2, Math.PI), outerMat), mito, false)
  shellLines('outer-membrane', R_OUT, H_OUT, 8, Math.PI / 2)
  const frontMat = mat(paper)
  const front = new Mesh(new LatheGeometry(capsuleProfile(R_OUT, H_OUT), 40, -Math.PI / 2, Math.PI), frontMat)
  add('outer-membrane', front, mito, false)

  // Inner shell is the backdrop of the matrix; taps there land "in the matrix".
  add('matrix', new Mesh(new LatheGeometry(capsuleProfile(R_IN, H_IN), 40, Math.PI / 2, Math.PI), mat(shade)), mito, false)
  shellLines('matrix', R_IN, H_IN, 5, Math.PI / 2)

  // Intermembrane space: the band between the membranes on the cut face.
  const band = capsuleShapePath(new Shape(), R_OUT, H_OUT) as Shape
  band.holes.push(capsuleShapePath(new Path(), R_IN, H_IN) as Path)
  add('intermembrane-space', new Mesh(new ShapeGeometry(band, 24), mat(deep)))

  // Cristae: shelves growing from the back wall, alternating sides.
  const r = R_IN - 0.02
  PLATE_Y.forEach((y, i) => {
    const left = i % 2 === 0
    const tip = left ? 0.3 : -0.3
    const s = new Shape()
    const zTip = -Math.sqrt(r * r - tip * tip)
    s.moveTo(tip, 0)
    s.lineTo(tip, zTip)
    if (left) s.absarc(0, 0, r, Math.atan2(zTip, tip), -Math.PI, true)
    else s.absarc(0, 0, r, Math.atan2(zTip, tip), 0, false)
    s.lineTo(tip, 0)
    const g = new ExtrudeGeometry(s, { depth: PLATE_T, bevelEnabled: false, curveSegments: 16 })
    const plate = new Mesh(g, mat(paper))
    plate.rotation.x = Math.PI / 2
    plate.position.y = y + PLATE_T / 2
    add('cristae', plate)

    // Transport chain complexes on the upper face, ATP synthases under the lower face.
    const dir = left ? -1 : 1
    for (const u of [0.15, 0.4]) {
      const c = new Mesh(new CylinderGeometry(0.05, 0.05, 0.11, 10), mat(paper))
      c.position.set(dir * u, y + PLATE_T / 2 + 0.05, -0.32)
      add('etc', c)
    }
    const stalk = new Mesh(new CylinderGeometry(0.018, 0.018, 0.1, 6), mat(paper))
    stalk.position.set(dir * 0.35, y - PLATE_T / 2 - 0.05, -0.55)
    add('atp-synthase', stalk, mito, false)
    const head = new Mesh(new SphereGeometry(0.06, 12, 10), mat(paper))
    head.position.set(dir * 0.35, y - PLATE_T / 2 - 0.12, -0.55)
    add('atp-synthase', head)
  })

  // Matrix contents: mitochondrial DNA loops and ribosomes.
  for (const [x, y] of [[0.05, 0.4], [-0.1, -0.4]] as const) {
    const t = new Mesh(new TorusGeometry(0.11, 0.012, 6, 32), mat(ink))
    t.position.set(x, y, -0.25)
    t.rotation.x = 0.4
    add('matrix', t, mito, false)
  }
  for (let i = 0; i < 14; i++) {
    const s = new Mesh(new SphereGeometry(0.022, 6, 5), mat(ink))
    s.position.set(Math.sin(i * 2.1) * 0.5, -1 + ((i * 0.37) % 2), -0.2 - (i % 4) * 0.12)
    add('matrix', s, mito, false)
  }

  // Cell context: outline, nucleus and neighbouring mitochondria. Shown on step 1 only.
  const cell = new Group()
  const cellLine = new LineBasicMaterial({ color: paper.clone().lerp(ink, 0.45) })
  disposables.push(cellLine)
  const ring = (rx: number, ry: number, x = 0, y = 0) => {
    const pts = new EllipseCurve(x, y, rx, ry).getPoints(80).map((p) => new Vector3(p.x, p.y, 0))
    const l = new Line(new BufferGeometry().setFromPoints(pts), cellLine)
    cell.add(l)
    disposables.push(l.geometry)
  }
  ring(9, 6.2)
  ring(2.3, 2.1, -3.6, 1.2)
  const miniGeo = new CapsuleGeometry(0.42, 1.1, 4, 10)
  disposables.push(miniGeo)
  for (const [x, y, a] of [[4, 2.6, 0.4], [3.6, -3, -0.6], [-4.8, -3.2, 1.2], [-0.6, -4.3, 0.1], [6.2, -0.5, 1.4], [-6.4, 2.8, -0.4]] as const) {
    const m = new Mesh(miniGeo, mat(shade))
    m.position.set(x, y, 0)
    m.rotation.z = a
    cell.add(m)
  }
  scene.add(cell)

  // Ions as moving points.
  const N = 40
  const pGeo = new BufferGeometry()
  pGeo.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3))
  const pMat = new PointsMaterial({ color: paper, size: 0.045 })
  const particles = new Points(pGeo, pMat)
  mito.add(particles)
  disposables.push(pGeo, pMat)
  const routes = (flow: Flow | undefined): [Vector3, Vector3][] => {
    const out: [Vector3, Vector3][] = []
    PLATE_Y.forEach((y, i) => {
      const dir = i % 2 === 0 ? -1 : 1
      if (flow === 'pump' || flow === 'recap')
        out.push([new Vector3(dir * 0.28, y + 0.42, -0.32), new Vector3(dir * 0.28, y + PLATE_T / 2, -0.32)])
      if (flow === 'synthase' || flow === 'recap')
        out.push([new Vector3(dir * 0.35, y, -0.55), new Vector3(dir * 0.35, y - 0.45, -0.55)])
    })
    return out
  }

  // Labels: HTML chips that follow their part's anchor.
  const labelEls = new Map<PartId, HTMLElement>()
  for (const id of Object.keys(ANCHOR) as PartId[]) {
    const el = document.createElement('span')
    el.className = 'stage-label'
    el.textContent = names[id]
    el.hidden = true
    labelLayer.appendChild(el)
    labelEls.set(id, el)
  }

  // ---- state
  let input: SceneInput = { stepIndex: 0, highlight: null, labels: [], outerVisible: true, flow: undefined, animate: true, replayKey: 0 }
  let zoom = 1
  const camPos = new Vector3(...CAMERA[0]!.pos)
  const camLook = new Vector3(...CAMERA[0]!.look)
  let tween: { from: Vector3; fromLook: Vector3; to: Vector3; toLook: Vector3; t0: number; dur: number } | null = null
  let currentRoutes = routes(undefined)
  let flowStart = performance.now()
  let particlesOn = true
  let visible = true
  let raf = 0
  let w = 1
  let h = 1

  function applyCamera() {
    const offset = camPos.clone().sub(camLook).multiplyScalar(zoom)
    camera.position.copy(camLook).add(offset)
    camera.lookAt(camLook)
  }

  function paint() {
    const hl = input.highlight
    for (const [part, meshes] of meshesByPart) {
      for (const m of meshes) {
        const material = m.material as MeshLambertMaterial
        const base = baseColor.get(material)!
        material.color.copy(hl === part ? accent : base)
        material.opacity = hl && hl !== part ? 0.32 : 1
        material.depthWrite = material.opacity === 1
      }
    }
    for (const [part, lines] of linesByPart) {
      for (const l of lines) (l.material as LineBasicMaterial).opacity = hl && hl !== part ? 0.25 : 1
    }
    const outer = input.outerVisible
    for (const m of meshesByPart.get('outer-membrane') ?? []) m.visible = outer && (m !== front || input.stepIndex === 0)
    for (const l of linesByPart.get('outer-membrane') ?? []) l.visible = outer
    cell.visible = input.stepIndex === 0
  }

  function layoutLabels() {
    const v = new Vector3()
    mito.updateWorldMatrix(true, false)
    const placed: { x: number; y: number; w: number }[] = []
    const items: { el: HTMLElement; id: PartId; x: number; y: number }[] = []
    for (const [id, el] of labelEls) {
      const on = input.labels.includes(id) && input.stepIndex > 0 && (id !== 'outer-membrane' || input.outerVisible)
      v.set(...ANCHOR[id]).applyMatrix4(mito.matrixWorld).project(camera)
      const x = (v.x * 0.5 + 0.5) * w
      const y = (-v.y * 0.5 + 0.5) * h
      el.hidden = !on || v.z > 1 || x < 0 || x > w || y < 0 || y > h
      if (!el.hidden) items.push({ el, id, x, y })
    }
    // The highlighted part keeps its exact spot; others step aside so labels never overlap.
    items.sort((a, b) => Number(b.id === input.highlight) - Number(a.id === input.highlight) || a.y - b.y)
    const H = 26
    for (const it of items) {
      const lw = it.el.offsetWidth
      const right = it.x > w / 2
      const left = Math.min(Math.max(4, right ? it.x - lw - 8 : it.x + 8), w - lw - 4)
      let top = it.y - H / 2
      while (placed.some((p) => Math.abs(p.y - top) < H && left < p.x + p.w && p.x < left + lw) && top < h - H) top += H
      placed.push({ x: left, y: top, w: lw })
      it.el.style.transform = `translate(${left.toFixed(0)}px, ${top.toFixed(0)}px)`
      it.el.classList.toggle('is-hl', it.id === input.highlight)
    }
  }

  // Frame-rate probe: ambient layers must hold 30 fps or switch themselves off (design doc 5).
  let frames = 0
  let probeStart = performance.now()
  let slowWindows = 0

  function frame(now: number) {
    raf = 0
    let more = false
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur)
      const e = 1 - (1 - k) ** 3
      camPos.lerpVectors(tween.from, tween.to, e)
      camLook.lerpVectors(tween.fromLook, tween.toLook, e)
      if (k >= 1) tween = null
      else more = true
    }
    applyCamera()
    const flowing = currentRoutes.length > 0 && particlesOn && input.animate
    particles.visible = currentRoutes.length > 0 && particlesOn
    if (particles.visible) {
      const pos = pGeo.attributes.position as BufferAttribute
      const t = flowing ? (now - flowStart) / 1600 : 0.5
      for (let i = 0; i < N; i++) {
        const [a, b] = currentRoutes[i % currentRoutes.length]!
        const f = (t + i * 0.137) % 1
        pos.setXYZ(i, a.x + (b.x - a.x) * f + Math.sin(i) * 0.04, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f + Math.cos(i) * 0.04)
      }
      pos.needsUpdate = true
      if (flowing) more = true
    }
    renderer.render(scene, camera)
    layoutLabels()
    if (flowing) {
      frames++
      if (now - probeStart > 2000) {
        const fps = (frames * 1000) / (now - probeStart)
        ;(window as unknown as { __lumenFps?: number }).__lumenFps = Math.round(fps)
        slowWindows = fps < 24 ? slowWindows + 1 : 0
        if (slowWindows >= 2) {
          particlesOn = false
          onNotice('Particle animation paused to keep this device responsive.')
        }
        frames = 0
        probeStart = now
      }
    }
    if (more && visible) raf = requestAnimationFrame(frame)
  }
  const requestFrame = () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  function resize() {
    w = Math.max(1, host.clientWidth)
    h = Math.max(1, host.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Narrow screens: pull back so the whole organelle fits.
    camera.fov = w / h < 1 ? 50 : 35
    camera.updateProjectionMatrix()
    requestFrame()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting
    if (visible) requestFrame()
  })
  io.observe(host)

  // ---- pointer: drag to rotate, tap to pick, wheel or pinch to zoom
  const ray = new Raycaster()
  const pointers = new Map<number, { x: number; y: number }>()
  let downAt: { x: number; y: number } | null = null
  let pinch = 0
  const el = renderer.domElement
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    downAt = { x: e.clientX, y: e.clientY }
    el.setPointerCapture?.(e.pointerId)
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    }
  }
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId)
    if (!prev) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      if (pinch) zoom = Math.min(2.5, Math.max(0.4, zoom * (pinch / d)))
      pinch = d
    } else {
      root.rotation.y += (e.clientX - prev.x) * 0.008
      if (e.pointerType === 'mouse') root.rotation.x = Math.max(-1.2, Math.min(1.2, root.rotation.x + (e.clientY - prev.y) * 0.008))
    }
    requestFrame()
  }
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (pointers.size < 2) pinch = 0
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return
    downAt = null
    const rect = el.getBoundingClientRect()
    ray.setFromCamera(new Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera)
    const hit = ray.intersectObjects(pickables.filter((m) => m.visible && (m.material as Material).opacity > 0), false)[0]
    const part = hit?.object.userData.part as PartId | undefined
    if (part && input.stepIndex > 0) onPick(part)
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    zoom = Math.min(2.5, Math.max(0.4, zoom * (e.deltaY > 0 ? 1.1 : 0.9)))
    requestFrame()
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  el.addEventListener('wheel', onWheel, { passive: false })

  resize()

  return {
    update(next) {
      const stepChanged = next.stepIndex !== input.stepIndex || next.replayKey !== input.replayKey
      if (next.flow !== input.flow || stepChanged) {
        currentRoutes = routes(next.flow)
        flowStart = performance.now()
      }
      input = next
      if (stepChanged) {
        const c = CAMERA[next.stepIndex]!
        const to = new Vector3(...c.pos)
        const toLook = new Vector3(...c.look)
        if (next.animate) tween = { from: camPos.clone(), fromLook: camLook.clone(), to, toLook, t0: performance.now(), dur: 600 }
        else {
          tween = null
          camPos.copy(to)
          camLook.copy(toLook)
        }
      }
      paint()
      requestFrame()
    },
    command(c) {
      if (c.type === 'rotate-left') root.rotation.y -= Math.PI / 9
      if (c.type === 'rotate-right') root.rotation.y += Math.PI / 9
      if (c.type === 'zoom-in') zoom = Math.max(0.4, zoom * 0.8)
      if (c.type === 'zoom-out') zoom = Math.min(2.5, zoom * 1.25)
      if (c.type === 'reset') {
        root.rotation.set(0, 0, 0)
        zoom = 1
      }
      requestFrame()
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      el.remove()
      labelLayer.replaceChildren()
    },
  }
}
