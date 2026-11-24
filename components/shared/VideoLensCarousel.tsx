'use client'

/* Carrusel de videoclips con lente de vidrio líquido (WebGL / Three.js).
   Adaptación del estudio de movimiento "curved glass lens carousel" (ver
   "prompt animación sección videoclips.txt"): una tira plana de portadas se
   dibuja en un render target con margen (padding) y una segunda pasada la
   refracta con una lente elíptica inclinada a los lados, con dispersión RGB.
   El centro queda recto y nítido.

   Integración en el sitio: fondo = color de la página, portadas = miniaturas
   de YouTube de los videoclips, clic (sin arrastrar) = reproduce el video en
   un modal. Sin captions sobre las portadas: el título del video centrado se
   muestra debajo, junto a la pista "Desliza o arrastra". */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type * as THREE_NS from 'three'
import { track } from '@/lib/analytics'
import { useFocusTrap } from '@/lib/useFocusTrap'

/* Un elemento del carrusel: un videoclip (id de YouTube → modal) o, con
   `image` + `href`, cualquier tarjeta que lleva a otra página (p. ej. el blog). */
export interface LensVideo { id: string; title: string; label: string; image?: string; href?: string }

interface Labels { hint: string; play: string; more: string; close: string }

const CARD_ASPECT  = 1.509
const THUMB_ASPECT = 16 / 9
const PAD          = 0.44          // margen del render target (× ancho/alto)
const EASE         = 0.09          // seguimiento target → current (por frame a 60 Hz)
const FRICTION     = 0.865         // inercia tras soltar
const SNAP_IDLE_MS = 120
const DRIFT_IDLE_S = 1.8
const DRIFT_PX     = 0.48          // px por frame a 60 Hz
const MAX_TARGET_PX = 4_200_000    // tope de píxeles del render target con margen

const MIN_STRIP    = 7             // con pocas tarjetas se repiten para llenar la tira

const rawImage = (v: LensVideo) => v.image ?? `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`
const thumbUrl = (v: LensVideo) => `/_next/image?url=${encodeURIComponent(rawImage(v))}&w=750&q=75`

/* ─── Shader de la lente ─── */
const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const FRAG = /* glsl */ `
uniform sampler2D tMap;
uniform vec2  uRes;    // tamaño del viewport (px CSS)
uniform vec2  uPad;    // margen del render target (px CSS)
uniform float uLens;   // 0 → 1 (entrada de la lente)
varying vec2 vUv;

vec2 toTex(vec2 uv) { return (uv * uRes + uPad) / (uRes + 2.0 * uPad); }

void main() {
  float aspect = uRes.x / uRes.y;

  // Coordenadas centradas, corregidas por aspecto
  vec2 p = vUv - 0.5;
  p.x *= aspect;

  // Rotación de 65° en sentido horario
  float a = radians(65.0);
  float ca = cos(a), sa = sin(a);
  vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);

  // Normalización por el semieje de la elipse (más ancha en pantallas anchas)
  float wide = max(1.0, aspect / (1440.0 / 1028.0));
  vec2 n = q / (vec2(0.565, 1.0) * wide);
  float d = length(n);

  float influence = 1.0 - smoothstep(0.93, 1.0, d);   // se apaga en el borde
  float rim       = smoothstep(0.578, 1.0, d);         // el centro no se toca

  vec2 dir  = p / max(length(p), 1e-4);                // radial (aspecto correcto)
  vec2 tang = vec2(-dir.y, dir.x);                      // tangente perpendicular
  float az  = atan(n.y, n.x);
  float w   = 0.55 * sin(2.0 * az) + 0.25 * sin(az);

  vec2 off   = tang * w * rim * 0.6 * min(d, 0.7825) * influence * uLens;
  vec2 uvOff = vec2(off.x / aspect, off.y);
  vec2 uv    = vUv + uvOff;

  // Dispersión espectral en los bordes refractivos: 12 muestras
  vec2 spread = uvOff * (11.0 * 0.004) * smoothstep(0.55, 1.0, d) * 6.0;
  vec3 acc  = vec3(0.0);
  vec3 wsum = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float t = float(i) / 11.0;
    vec3 tex = texture2D(tMap, toTex(uv + spread * (t - 0.5))).rgb;
    vec3 wt = vec3(
      exp(-pow(t - 0.0, 2.0) / (2.0 * 0.38 * 0.38)),
      exp(-pow(t - 0.5, 2.0) / (2.0 * 0.38 * 0.38)),
      exp(-pow(t - 1.0, 2.0) / (2.0 * 0.38 * 0.38))
    );
    acc  += tex * wt;
    wsum += wt;
  }
  gl_FragColor = vec4(acc / wsum, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function VideoLensCarousel({ videos, labels }: { videos: LensVideo[]; labels: Labels }) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const [center, setCenter]     = useState(0)
  const [playing, setPlaying]   = useState<LensVideo | null>(null)
  const openRef = useRef<(i: number) => void>(() => {})
  const router = useRouter()

  const open = useCallback((i: number) => {
    const v = videos[i]
    if (!v) return
    if (v.href) { router.push(v.href); return }
    window.dispatchEvent(new Event('rafa:pause'))   // pausa el reproductor de música
    track('video_play', { video: v.id, title: v.title, source: 'carousel' })
    setPlaying(v)
  }, [videos, router])
  openRef.current = open

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas || videos.length === 0) return

    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      let THREE: typeof THREE_NS
      try {
        THREE = await import('three')
      } catch {
        setFallback(true)
        return
      }
      if (disposed) return

      let renderer: THREE_NS.WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
      } catch {
        setFallback(true)
        return
      }

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
      const bg = new THREE.Color(getComputedStyle(document.body).backgroundColor || '#0a0a0a')
      renderer.setClearColor(bg, 1)

      /* ── Escena 1: la tira plana ── */
      const stripScene = new THREE.Scene()
      const stripCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)
      const plane      = new THREE.PlaneGeometry(1, 1)
      const loader     = new THREE.TextureLoader()
      const textures: THREE_NS.Texture[] = []
      const materials = videos.map(v => {
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, toneMapped: false })
        loader.load(thumbUrl(v), tex => {
          if (disposed) { tex.dispose(); return }
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = 4
          // recorte "cover" a la proporción de la tarjeta (1.509), sea cual sea la imagen
          const img = tex.image as { width?: number; height?: number } | undefined
          const ar = img?.width && img?.height ? img.width / img.height : THUMB_ASPECT
          if (ar >= CARD_ASPECT) { tex.repeat.set(CARD_ASPECT / ar, 1); tex.offset.set((1 - CARD_ASPECT / ar) / 2, 0) }
          else { tex.repeat.set(1, ar / CARD_ASPECT); tex.offset.set(0, (1 - ar / CARD_ASPECT) / 2) }
          textures.push(tex)
          mat.map = tex
          mat.color.set(0xffffff)
          mat.needsUpdate = true
        })
        return mat
      })
      // Con pocas tarjetas la tira repite la lista (n = posiciones en la tira)
      const real = videos.length
      const n = real * Math.max(1, Math.ceil(MIN_STRIP / real))
      const slots = Array.from({ length: n }, (_, i) => materials[i % real])
      // Tres copias de la tira para que el campo con margen siempre esté lleno
      const meshes = [-1, 0, 1].flatMap(k =>
        slots.map((m, i) => {
          const mesh = new THREE.Mesh(plane, m)
          mesh.userData = { i, k }
          stripScene.add(mesh)
          return mesh
        }),
      )

      /* ── Escena 2: la lente (quad de pantalla completa) ── */
      let target = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false })
      const lensMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          tMap:  { value: target.texture },
          uRes:  { value: new THREE.Vector2(1, 1) },
          uPad:  { value: new THREE.Vector2(0, 0) },
          uLens: { value: 0 },
        },
        depthTest: false,
        depthWrite: false,
      })
      const quadGeo  = new THREE.PlaneGeometry(2, 2)
      const lensScene = new THREE.Scene()
      lensScene.add(new THREE.Mesh(quadGeo, lensMat))
      const lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      /* ── Medidas ── */
      let W = 1, H = 1, cardW = 1, cardH = 1, gap = 14, step = 1, L = 1, padX = 0, padY = 0

      const resize = () => {
        W = wrap.clientWidth || 1
        const vw = window.innerWidth
        const phone = vw < 640
        cardW = phone ? vw * 0.64 : Math.min(vw * 0.205, 470)
        gap   = phone ? 10 : 14
        cardH = cardW / CARD_ASPECT
        H     = Math.round(cardH * (phone ? 1.55 : 1.75))
        wrap.style.height = `${H}px`
        step = cardW + gap
        L    = step * n
        padX = W * PAD
        padY = H * PAD

        const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
        renderer.setPixelRatio(dpr)
        renderer.setSize(W, H, false)

        const tw = W + 2 * padX, th = H + 2 * padY
        const tdpr = Math.min(dpr, Math.sqrt(MAX_TARGET_PX / (tw * th)))
        target.setSize(Math.max(2, Math.round(tw * tdpr)), Math.max(2, Math.round(th * tdpr)))

        stripCam.left = -tw / 2; stripCam.right = tw / 2
        stripCam.top  =  th / 2; stripCam.bottom = -th / 2
        stripCam.updateProjectionMatrix()

        lensMat.uniforms.uRes.value.set(W, H)
        lensMat.uniforms.uPad.value.set(padX, padY)
        needsFrame = true
      }

      /* ── Estado de movimiento ── */
      let current = 0, tgt = 0, prevCurrent = 0, vel = 0
      let shrink = 0
      let dragging = false, dragStartX = 0, dragStartY = 0, dragStartTgt = 0, dragMoved = false
      let lastMoveX = 0, lastMoveT = 0
      let hovered = false, focused = false
      let lastInput = -Infinity          // performance.now() de la última interacción
      let releasedAt = -Infinity
      let snapped = true
      let entryT = reduce.matches ? 99 : -1   // -1 = aún no ha entrado en pantalla
      let inView = false, pageVisible = !document.hidden, parentActive = true
      let raf = 0, last = 0, needsFrame = true
      let centerIdx = -1

      const wrapX = (x: number) => ((((x + L / 2) % L) + L) % L) - L / 2
      const nearest = (x: number) => Math.round(x / step) * step
      const touch = () => { lastInput = performance.now(); snapped = false }

      /* ── Bucle ── */
      const frame = (now: number) => {
        raf = 0
        const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60)
        last = now
        const f = dt * 60
        const rm = reduce.matches

        // Entrada
        if (entryT >= 0 && entryT < 99) entryT += dt
        const te = entryT < 0 ? 0 : entryT

        // Inercia tras soltar + snap
        if (!dragging && !rm) {
          if (Math.abs(vel) > 0.02) {
            tgt += vel * f
            vel *= Math.pow(FRICTION, f)
          } else vel = 0
          if (!snapped && vel === 0 && now - Math.max(lastInput, releasedAt) > SNAP_IDLE_MS) {
            tgt = nearest(tgt); snapped = true
          }
        }

        // Deriva suave en reposo
        const idle = (now - lastInput) / 1000 > DRIFT_IDLE_S && te > 1.6
        if (!rm && idle && !hovered && !focused && !dragging && snapped) {
          tgt += DRIFT_PX * f
        }

        // target → current
        if (rm) current = tgt
        else current += (tgt - current) * (1 - Math.pow(1 - EASE, f))

        // Encogimiento por velocidad (hasta 7 % a 60 px/frame)
        const speed = Math.abs(current - prevCurrent) / Math.max(f, 1e-3)
        prevCurrent = current
        const want = Math.min(speed / 60, 1) * 0.07
        shrink += (want - shrink) * (1 - Math.pow(1 - (want > shrink ? 0.25 : 0.06), f))

        // Posicionar portadas
        const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3)
        const inOut = (x: number) => { x = Math.min(Math.max(x, 0), 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
        const grow = 0.55 + 0.45 * inOut((te - 0.55) / 0.6)
        for (const mesh of meshes) {
          const { i, k } = mesh.userData as { i: number; k: number }
          const x = wrapX(i * step - current) + k * L
          const delay = Math.min(Math.max((x + W / 2) / W, 0), 1) * 0.35
          const rise = ease((te - delay) / 0.7)
          const s = 1 - shrink
          mesh.position.set(x, -(1 - rise) * H * 0.75, 0)
          mesh.scale.set(cardW * s, cardH * s * grow, 1)
          mesh.visible = Math.abs(x) < W / 2 + padX + cardW
        }
        lensMat.uniforms.uLens.value = ease((te - 0.9) / 0.7)

        // Video centrado → leyenda
        const ci = (((Math.round(current / step) % n) + n) % n) % real
        if (ci !== centerIdx) { centerIdx = ci; setCenter(ci) }

        renderer.setRenderTarget(target)
        renderer.render(stripScene, stripCam)
        renderer.setRenderTarget(null)
        renderer.render(lensScene, lensCam)

        // ¿Seguir animando?
        const settled = Math.abs(tgt - current) < 0.05 && vel === 0 && shrink < 1e-3 && te > 1.7
        const willDrift = !rm && !hovered && !focused && !dragging && snapped
        if (running() && (!settled || willDrift || dragging || needsFrame)) schedule()
        needsFrame = false
      }

      const running = () => inView && pageVisible && parentActive && !disposed
      const schedule = () => { if (!raf && running()) { raf = requestAnimationFrame(frame) } }
      const kick = () => { needsFrame = true; if (!raf) last = 0; schedule() }

      /* ── Entrada de datos ── */
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        dragging = true; dragMoved = false
        dragStartX = lastMoveX = e.clientX; dragStartY = e.clientY
        dragStartTgt = tgt; vel = 0; lastMoveT = performance.now()
        canvas.setPointerCapture(e.pointerId)
        touch(); kick()
      }
      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        const dx = e.clientX - dragStartX
        if (!dragMoved && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(e.clientY - dragStartY)) dragMoved = true
        if (!dragMoved) return
        const now = performance.now()
        const frameDx = e.clientX - lastMoveX
        const fdt = Math.max(1, now - lastMoveT) / (1000 / 60)
        vel = -frameDx / fdt
        lastMoveX = e.clientX; lastMoveT = now
        tgt = dragStartTgt - dx
        if (reduce.matches) current = tgt
        touch(); kick()
      }
      const endDrag = (e: PointerEvent, cancelled: boolean) => {
        if (!dragging) return
        dragging = false
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
        releasedAt = performance.now()
        if (performance.now() - lastMoveT > 80 || reduce.matches) vel = 0
        if (!dragMoved && !cancelled) {
          // Clic sin arrastre → reproducir la portada bajo el puntero
          const r = canvas.getBoundingClientRect()
          const px = e.clientX - r.left - W / 2
          const py = -(e.clientY - r.top - H / 2)
          for (let i = 0; i < n; i++) {
            const x = wrapX(i * step - current)
            if (Math.abs(px - x) <= cardW / 2 && Math.abs(py) <= cardH / 2) { openRef.current(i % real); break }
          }
        }
        touch(); kick()
      }
      const onUp = (e: PointerEvent) => endDrag(e, false)
      const onCancel = (e: PointerEvent) => endDrag(e, true)

      const onWheel = (e: WheelEvent) => {
        // Solo el gesto horizontal (trackpad o Shift + rueda): no secuestra el scroll de la página
        const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
        if (!dx) return
        e.preventDefault()
        tgt += dx * (e.deltaMode === 1 ? 16 : 1)
        if (reduce.matches) current = tgt
        vel = 0; touch(); kick()
      }

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          tgt = nearest(tgt) + (e.key === 'ArrowRight' ? step : -step)
        } else if (e.key === 'Home') {
          e.preventDefault(); tgt = 0
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openRef.current((((Math.round(tgt / step) % n) + n) % n) % real)
          return
        } else return
        vel = 0
        if (reduce.matches) current = tgt
        touch(); snapped = true; kick()
      }

      const onEnter = () => { hovered = true }
      const onLeave = () => { hovered = false; kick() }
      const onFocus = () => { focused = true }
      const onBlur  = () => { focused = false; kick() }

      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointercancel', onCancel)
      canvas.addEventListener('lostpointercapture', onCancel)
      canvas.addEventListener('wheel', onWheel, { passive: false })
      canvas.addEventListener('keydown', onKey)
      canvas.addEventListener('pointerenter', onEnter)
      canvas.addEventListener('pointerleave', onLeave)
      canvas.addEventListener('focus', onFocus)
      canvas.addEventListener('blur', onBlur)

      /* ── Ciclo de vida: fuera de pantalla / pestaña oculta / iframe inactivo ── */
      const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting
        if (inView && entryT < 0) entryT = 0          // la entrada empieza al verse
        if (inView) kick()
      }, { threshold: 0.05 })
      io.observe(wrap)

      const onVisibility = () => { pageVisible = !document.hidden; if (pageVisible) kick() }
      document.addEventListener('visibilitychange', onVisibility)

      const onMessage = (e: MessageEvent) => {
        if (e.origin !== location.origin || typeof e.data !== 'object' || e.data === null) return
        if ('active' in e.data) { parentActive = e.data.active !== false; if (parentActive) kick() }
      }
      window.addEventListener('message', onMessage)

      const ro = new ResizeObserver(() => { resize(); kick() })
      ro.observe(wrap)
      const onMotion = () => { if (reduce.matches) { entryT = 99; vel = 0; current = tgt } kick() }
      reduce.addEventListener('change', onMotion)

      const onContextLost = (e: Event) => { e.preventDefault(); setFallback(true) }
      canvas.addEventListener('webglcontextlost', onContextLost)

      resize()
      kick()

      cleanup = () => {
        cancelAnimationFrame(raf)
        io.disconnect(); ro.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('message', onMessage)
        reduce.removeEventListener('change', onMotion)
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('pointercancel', onCancel)
        canvas.removeEventListener('lostpointercapture', onCancel)
        canvas.removeEventListener('wheel', onWheel)
        canvas.removeEventListener('keydown', onKey)
        canvas.removeEventListener('pointerenter', onEnter)
        canvas.removeEventListener('pointerleave', onLeave)
        canvas.removeEventListener('focus', onFocus)
        canvas.removeEventListener('blur', onBlur)
        canvas.removeEventListener('webglcontextlost', onContextLost)
        meshes.forEach(m => stripScene.remove(m))
        plane.dispose(); quadGeo.dispose()
        materials.forEach(m => m.dispose())
        textures.forEach(t => t.dispose())
        lensMat.dispose()
        target.dispose()
        renderer.dispose()
      }
    })()

    return () => { disposed = true; cleanup() }
  }, [videos])

  const v = videos[center]

  return (
    <div>
      {fallback ? (
        <div className="video-lens-fallback" role="list">
          {videos.map((vid, i) => (
            <button key={vid.id} type="button" role="listitem" onClick={() => open(i)} aria-label={`${labels.play} ${vid.title}`}>
              <Image src={rawImage(vid)} alt="" fill sizes="(min-width: 640px) 470px, 64vw" className="object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div ref={wrapRef} className="video-lens" style={{ height: 'clamp(320px, 36vw, 560px)' }}>
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-roledescription="carrusel"
            aria-label={`${labels.more}. ${labels.hint}. Enter: ${labels.play.replace(/:$/, '')}`}
          />
        </div>
      )}

      {/* Leyenda: video centrado + pista */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-6"
        style={{ maxWidth: 1200, margin: '1.25rem auto 0' }}
      >
        <p aria-live="polite" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--rafa-text)', fontWeight: 500 }}>
          {v?.title}
          <span style={{ marginLeft: '0.75rem', fontSize: '0.66rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rafa-accent)', fontWeight: 400 }}>
            {v?.label}
          </span>
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rafa-muted)' }}>
          {labels.hint}
        </p>
      </div>

      {/* Acceso directo para lectores de pantalla / teclado */}
      <ul className="sr-only">
        {videos.map((vid, i) => (
          <li key={vid.id}>
            <button type="button" onClick={() => open(i)}>{`${labels.play} ${vid.title} — ${vid.label}`}</button>
          </li>
        ))}
      </ul>

      {playing && <VideoModal video={playing} closeLabel={labels.close} onClose={() => setPlaying(null)} />}
    </div>
  )
}

/* Modal de reproducción */
function VideoModal({ video, closeLabel, onClose }: { video: LensVideo; closeLabel: string; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useFocusTrap(panel, true)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      prevFocus?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 99990 }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 99991, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', pointerEvents: 'none' }}>
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          className="modal-panel"
          style={{ pointerEvents: 'all', width: '100%', maxWidth: 1100 }}
        >
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--rafa-text)', fontWeight: 500 }}>
              {video.title}
              <span style={{ marginLeft: '0.75rem', fontSize: '0.66rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rafa-accent)', fontWeight: 400 }}>
                {video.label}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="popup-close"
              style={{ background: 'none', border: 'none', color: 'var(--rafa-muted)', fontSize: '1rem', cursor: 'pointer', padding: '0.4rem 0.6rem' }}
            >
              ✕
            </button>
          </div>
          <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
