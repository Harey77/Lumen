import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three'

/** A schematic (not anatomically exact) heart: four chambers, great vessels and two blood circuits. */
export type HeartPart = 'right-atrium' | 'right-ventricle' | 'left-atrium' | 'left-ventricle' | 'aorta' | 'pulmonary-artery' | 'venae-cavae' | 'pulmonary-veins'

export interface HeartApi {
  update(s: { highlight: HeartPart | null; labels: boolean; flow: boolean }): void
  command(c: 'left' | 'right' | 'in' | 'out' | 'reset'): void
  dispose(): void
}

const css = (n: string) => new Color(getComputedStyle(document.documentElement).getPropertyValue(n).trim() || 'white')

// Viewer's left is the heart's right side (anatomical convention), as in textbook diagrams.
const CHAMBERS: { id: HeartPart; pos: [number, number, number]; scale: [number, number, number]; oxy: boolean }[] = [
  { id: 'right-atrium', pos: [-0.62, 0.5, 0.05], scale: [0.46, 0.42, 0.42], oxy: false },
  { id: 'right-ventricle', pos: [-0.38, -0.38, 0.18], scale: [0.6, 0.78, 0.5], oxy: false },
  { id: 'left-atrium', pos: [0.6, 0.55, -0.15], scale: [0.44, 0.4, 0.4], oxy: true },
  { id: 'left-ventricle', pos: [0.4, -0.48, -0.02], scale: [0.62, 0.9, 0.56], oxy: true },
]

const VESSELS: { id: HeartPart; oxy: boolean; pts: [number, number, number][]; r: number }[] = [
  { id: 'aorta', oxy: true, r: 0.12, pts: [[0.25, -0.1, 0.05], [0.1, 0.65, 0.1], [0.05, 1.25, 0], [-0.4, 1.45, -0.1], [-0.7, 1.1, -0.25]] },
  { id: 'pulmonary-artery', oxy: false, r: 0.11, pts: [[-0.2, -0.05, 0.3], [-0.05, 0.6, 0.35], [0.2, 1.0, 0.3], [0.75, 1.15, 0.1], [1.25, 1.05, 0]] },
  { id: 'venae-cavae', oxy: false, r: 0.1, pts: [[-0.85, 1.5, 0.05], [-0.72, 0.95, 0.05], [-0.65, 0.55, 0.05]] },
  { id: 'pulmonary-veins', oxy: true, r: 0.07, pts: [[1.45, 0.75, -0.2], [1.0, 0.62, -0.18], [0.65, 0.55, -0.15]] },
]

const ANCHOR: Record<HeartPart, [number, number, number]> = {
  'right-atrium': [-0.75, 0.62, 0.35],
  'right-ventricle': [-0.55, -0.6, 0.55],
  'left-atrium': [0.85, 0.6, 0.1],
  'left-ventricle': [0.65, -0.75, 0.4],
  aorta: [-0.25, 1.48, 0],
  'pulmonary-artery': [0.9, 1.2, 0.25],
  'venae-cavae': [-0.95, 1.4, 0.1],
  'pulmonary-veins': [1.35, 0.8, -0.1],
}

export const PART_NAMES: Record<HeartPart, string> = {
  'right-atrium': 'Right atrium',
  'right-ventricle': 'Right ventricle',
  'left-atrium': 'Left atrium',
  'left-ventricle': 'Left ventricle',
  aorta: 'Aorta',
  'pulmonary-artery': 'Pulmonary artery',
  'venae-cavae': 'Venae cavae',
  'pulmonary-veins': 'Pulmonary veins',
}

export function createHeartScene(host: HTMLElement, labelLayer: HTMLElement, onPick: (p: HeartPart) => void, animate: boolean): HeartApi {
  const oxy = css('--blood-oxy')
  const deoxy = css('--blood-deoxy')
  const accent = css('--night-accent')

  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.domElement.className = 'heart3d__canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.prepend(renderer.domElement)
  const scene = new Scene()
  const camera = new PerspectiveCamera(38, 1, 0.1, 50)
  camera.position.set(0, 0.35, 5)
  scene.add(new AmbientLight(0xffffff, 1.1))
  const key = new DirectionalLight(0xffffff, 2)
  key.position.set(2, 3, 4)
  scene.add(key)

  const root = new Group()
  root.position.y = -0.3
  scene.add(root)
  const disposables: { dispose(): void }[] = []
  const meshes = new Map<HeartPart, Mesh>()
  const base = new Map<HeartPart, Color>()

  const mat = (c: Color) => {
    const m = new MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, transparent: true })
    disposables.push(m)
    return m
  }
  const sphere = new SphereGeometry(1, 40, 28)
  disposables.push(sphere)
  for (const c of CHAMBERS) {
    const m = new Mesh(sphere, mat(c.oxy ? oxy : deoxy))
    m.position.set(...c.pos)
    m.scale.set(...c.scale)
    m.userData.part = c.id
    root.add(m)
    meshes.set(c.id, m)
    base.set(c.id, (c.oxy ? oxy : deoxy).clone())
  }
  const curves: Partial<Record<HeartPart, CatmullRomCurve3>> = {}
  for (const v of VESSELS) {
    const curve = new CatmullRomCurve3(v.pts.map((p) => new Vector3(...p)))
    curves[v.id] = curve
    const g = new TubeGeometry(curve, 48, v.r, 14, false)
    disposables.push(g)
    const m = new Mesh(g, mat(v.oxy ? oxy : deoxy))
    m.userData.part = v.id
    root.add(m)
    meshes.set(v.id, m)
    base.set(v.id, (v.oxy ? oxy : deoxy).clone())
  }

  // Blood flow: one deoxygenated path (body -> right heart -> lungs) and one oxygenated path (lungs -> left heart -> body).
  const path = (pts: [number, number, number][]) => new CatmullRomCurve3(pts.map((p) => new Vector3(...p)))
  const deoxyPath = path([[-0.85, 1.5, 0.3], [-0.65, 0.6, 0.45], [-0.45, -0.2, 0.6], [-0.3, -0.6, 0.6], [-0.15, 0.2, 0.55], [0.15, 1.0, 0.45], [0.75, 1.15, 0.3], [1.3, 1.05, 0.2]])
  const oxyPath = path([[1.45, 0.75, 0.15], [0.85, 0.55, 0.3], [0.55, -0.3, 0.55], [0.4, -0.8, 0.5], [0.2, 0.2, 0.45], [0.1, 1.25, 0.3], [-0.4, 1.5, 0.2], [-0.75, 1.1, 0.0]])
  const N = 36
  const flows = [deoxyPath, oxyPath].map((curve, k) => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3))
    const m = new PointsMaterial({ color: k === 0 ? deoxy.clone().offsetHSL(0, 0, 0.25) : oxy.clone().offsetHSL(0, 0, 0.2), size: 0.07 })
    disposables.push(g, m)
    const pts = new Points(g, m)
    root.add(pts)
    return { curve, g, pts }
  })

  const labelEls = new Map<HeartPart, HTMLElement>()
  for (const id of Object.keys(ANCHOR) as HeartPart[]) {
    const el = document.createElement('span')
    el.className = 'stage-label'
    el.textContent = PART_NAMES[id]
    labelLayer.appendChild(el)
    labelEls.set(id, el)
  }

  let state = { highlight: null as HeartPart | null, labels: true, flow: true }
  let zoom = 1
  let raf = 0
  let w = 1
  let h = 1
  let visible = true
  const t0 = performance.now()

  function paint() {
    for (const [id, m] of meshes) {
      const mm = m.material as MeshStandardMaterial
      const on = !state.highlight || state.highlight === id
      mm.color.copy(state.highlight === id ? base.get(id)!.clone().lerp(accent, 0.35) : base.get(id)!)
      mm.emissive.copy(state.highlight === id ? accent : new Color(0x000000))
      mm.emissiveIntensity = state.highlight === id ? 0.25 : 0
      mm.opacity = on ? 1 : 0.35
      mm.depthWrite = on
    }
  }

  function labels() {
    const v = new Vector3()
    root.updateWorldMatrix(true, true)
    const placed: { x: number; y: number; w: number }[] = []
    for (const [id, el] of labelEls) {
      const on = state.labels && (!state.highlight || state.highlight === id || !(['venae-cavae', 'pulmonary-veins'] as HeartPart[]).includes(id))
      v.set(...ANCHOR[id]).applyMatrix4(root.matrixWorld).project(camera)
      const x = (v.x * 0.5 + 0.5) * w
      const y = (-v.y * 0.5 + 0.5) * h
      el.hidden = !on || v.z > 1
      if (el.hidden) continue
      const lw = el.offsetWidth
      const left = Math.min(Math.max(4, x - lw / 2), w - lw - 4)
      let top = Math.min(Math.max(4, y - 12), h - 28)
      while (placed.some((p) => Math.abs(p.y - top) < 24 && left < p.x + p.w && p.x < left + lw) && top < h - 28) top += 24
      placed.push({ x: left, y: top, w: lw })
      el.style.transform = `translate(${left.toFixed(0)}px, ${top.toFixed(0)}px)`
      el.classList.toggle('is-hl', state.highlight === id)
    }
  }

  function frame(now: number) {
    raf = 0
    // rAF timestamps can precede performance.now() on the first frame; keep time (and curve positions) non-negative.
    const t = Math.max(0, now - t0) / 1000
    const moving = animate && state.flow
    for (const [k, f] of flows.entries()) {
      f.pts.visible = state.flow
      if (!state.flow) continue
      const pos = f.g.attributes.position as BufferAttribute
      for (let i = 0; i < N; i++) {
        const u = ((moving ? t * 0.12 : 0) + i / N + k * 0.013) % 1
        const p = f.curve.getPointAt(u)
        pos.setXYZ(i, p.x, p.y, p.z)
      }
      pos.needsUpdate = true
    }
    // A gentle heartbeat scale on the ventricles; skipped when motion is reduced.
    const beat = moving ? 1 + Math.max(0, Math.sin(t * 7)) * 0.025 : 1
    for (const c of CHAMBERS) if (c.id.endsWith('ventricle')) meshes.get(c.id)!.scale.set(c.scale[0] * beat, c.scale[1] * beat, c.scale[2] * beat)
    camera.position.set(0, 0.35, 5 * zoom)
    camera.lookAt(0, 0.15, 0)
    renderer.render(scene, camera)
    labels()
    if (moving && visible) raf = requestAnimationFrame(frame)
  }
  const request = () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  const resize = () => {
    w = Math.max(1, host.clientWidth)
    h = Math.max(1, host.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 1 ? 52 : 38
    camera.updateProjectionMatrix()
    request()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting
    if (visible) request()
  })
  io.observe(host)

  const el = renderer.domElement
  let down: { x: number; y: number; px: number } | null = null
  const ray = new Raycaster()
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, px: e.clientX }
    el.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!down) return
    root.rotation.y += (e.clientX - down.px) * 0.01
    down.px = e.clientX
    request()
  }
  const onUp = (e: PointerEvent) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
      const r = el.getBoundingClientRect()
      ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
      const hit = ray.intersectObjects([...meshes.values()], false)[0]
      if (hit) onPick(hit.object.userData.part as HeartPart)
    }
    down = null
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  resize()

  return {
    update(s) {
      state = s
      paint()
      request()
    },
    command(c) {
      if (c === 'left') root.rotation.y -= Math.PI / 8
      if (c === 'right') root.rotation.y += Math.PI / 8
      if (c === 'in') zoom = Math.max(0.55, zoom * 0.85)
      if (c === 'out') zoom = Math.min(1.8, zoom * 1.18)
      if (c === 'reset') {
        root.rotation.set(0, 0, 0)
        zoom = 1
      }
      request()
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      disposables.forEach((d) => d.dispose())
      for (const m of meshes.values()) (m.material as Material).dispose()
      renderer.dispose()
      el.remove()
      labelLayer.replaceChildren()
    },
  }
}
