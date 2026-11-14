import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"

// #region archive
// Pure: scroll beats, easing and the wall's geometry. No React, no DOM: the test lifts this region and runs it.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Frame-rate independent approach toward a target (tau in ms): a critically smooth ease with no overshoot. */
export const approach = (cur: number, target: number, dt: number, tau: number) => target + (cur - target) * Math.exp(-Math.max(0, dt) / tau)
/** 0 → 1 while the stage is pinned inside its track; clamps outside it, never NaN. */
export const progressFrom = (top: number, length: number, stage: number) => {
  const travel = length - stage
  if (!(travel > 0)) return 0
  return clamp01((0 - top) / travel)
}
/** Track length, in stage heights. */
export const TRACK = { archive: 3.4 } as const
/** Scrolling this far into the archive track (0..1) leaves the preview for the grid. */
export const GRID_AT = 0.06
/** Grid pitch: 13.5 columns across a desktop, as measured; fewer on phones. */
export const pitchFor = (W: number) => (W < 640 ? W / 4.5 : W < 1000 ? W / 8 : W / 13.5)
/** Wrap a pan offset into one pitch so a fixed pool of cells can tile forever. */
export const wrap = (x: number, m: number) => (m > 0 ? ((x % m) + m) % m : 0)
/** Which picture a grid cell shows, for logical column c and row r: deterministic and neighbour-varied. */
export const cellKind = (c: number, r: number, n: number) => (((c * 7 + r * 11 + ((r & 1) ? 3 : 0)) % n) + n) % n
/** Rows sit 1.75 column pitches apart, as measured. */
export const ROW = 1.75
/** The vertical scroll pan of the grid at archive progress p, in rows. */
export const gridPanAt = (p: number) => Math.max(0, p - GRID_AT) * 18
/** The counter: "Scrap 0001 / 1204" at the top of the track, "1204 / 1204" at the bottom. */
export const TOTAL = 1204
export const countAt = (p: number) => "Scrap " + ("000" + Math.round(lerp(1, TOTAL, p))).slice(-4) + " / " + TOTAL
/** The preview's side rows: n scraps stepping 5 pictures at a time from `from`. */
export const rowFrom = (n: number, from: number, total: number) => Array.from({ length: n }, (_, j) => (from + j * 5) % total)
// #endregion

/* ------------------------------------------------------------- content */

export type Scrap = { src: string; name: string }
export type ScrapWallArchiveProps = {
  /** Height of the pinned stage. Must be a definite length. */
  height?: string
  /** Pictures on the wall. Square art reads best; the grid crops it to a few shapes. */
  items?: Scrap[]
  /** Heading, bottom left. */
  title?: string
  className?: string
  style?: CSSProperties
}

const KINDS = ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"]
const SCRAP_NAMES = ["Drip test", "Cat FM ident", "Can boy", "Cloud sketch", "Shoe with wings", "Spiky barista", "Moon nap", "Dice duo", "Boom box", "Surf toast", "Paint juggler", "Egg driver", "Tape snail", "Sauce dragon", "Sock ghost", "Scarf planet", "Gardener bot", "Bath banana"]
/** Shapes the grid crops its scraps to, so the wall isn't all squares. */
const SHAPES = ["1/1", "3/4", "4/3", "1/1", "4/5", "5/4"]
const POOL_C = 16
const POOL_R = 10
let defaults: Scrap[] | null = null
const defaultItems = () => (defaults ??= KINDS.map((k, i) => ({ src: IMG[k], name: SCRAP_NAMES[i] })))

/* ------------------------------------------------------------- styles */

const CSS =
  ".bkm-root{--butter:#ffe98a;--deep:#0d137a;--ink:#0c0c10;--paper:#f6f1e3;position:relative;overflow:clip;background:var(--ink);color:var(--paper);font-family:BkmSans,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;isolation:isolate}" +
  ".dark .bkm-root{--ink:#08080b}" +
  ".bkm-root *{box-sizing:border-box}" +
  ".bkm-root svg,.bkm-root img{max-width:none}" +
  ".bkm-mono{font-family:BkmMono,ui-monospace,monospace;font-size:11px;line-height:1.35;letter-spacing:.06em;text-transform:uppercase}" +
  ".bkm-stars{background-color:var(--ink);background-image:radial-gradient(circle at 20% 30%,rgba(246,241,227,.42) 0 1px,transparent 1.6px),radial-gradient(circle at 80% 70%,rgba(246,241,227,.22) 0 1.3px,transparent 2px),radial-gradient(circle at 50% 50%,rgba(246,241,227,.12) 0 2px,transparent 2.6px);background-size:71px 83px,113px 97px,197px 181px}" +
  ".bkm-track{position:relative}" +
  ".bkm-stage{position:sticky;top:0;overflow:hidden}" +
  ".bkm-hit{cursor:pointer;outline:none}" +
  ".bkm-hit:focus-visible{outline:2px solid var(--butter);outline-offset:3px}" +
  /* archive */
  ".bkm-arch{position:relative;z-index:4}" +
  ".bkm-grid{position:absolute;inset:0;transition:opacity .45s cubic-bezier(.2,.8,.2,1),transform .45s cubic-bezier(.2,.8,.2,1)}" +
  ".bkm-arch[data-mode=preview] .bkm-grid{opacity:0;transform:scale(1.35);pointer-events:none}" +
  ".bkm-cell{position:absolute;left:0;top:0;display:grid;place-items:center;padding:0;border:0;background:none;cursor:pointer;will-change:transform}" +
  ".bkm-cell i{display:block;width:62%;background-size:cover;background-position:center;transition:transform .35s cubic-bezier(.2,1.5,.4,1)}" +
  "@media (hover:hover){.bkm-cell:hover i{transform:scale(1.18)}}" +
  ".bkm-cell:focus-visible{outline:2px solid var(--butter);outline-offset:-4px}" +
  ".bkm-pv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .45s cubic-bezier(.2,.8,.2,1),transform .45s cubic-bezier(.2,.8,.2,1)}" +
  ".bkm-arch[data-mode=grid] .bkm-pv{opacity:0;transform:scale(.3);pointer-events:none}" +
  ".bkm-pvbig{position:relative;height:min(63%,82vw);aspect-ratio:3/4;padding:0;border:0;background-size:cover;background-position:center;background-color:#16161b;z-index:2}" +
  ".bkm-pvrow{position:absolute;left:0;right:0;top:50%;height:0}" +
  ".bkm-pvrow button{position:absolute;top:0;width:clamp(34px,3.6vw,56px);aspect-ratio:1;margin-top:clamp(-28px,-1.8vw,-17px);padding:0;border:0;background-size:cover;background-position:center;background-color:#16161b;cursor:pointer;transition:transform .3s cubic-bezier(.2,1.5,.4,1)}" +
  "@media (hover:hover){.bkm-pvrow button:hover{transform:scale(1.15)}}" +
  ".bkm-pvrow button:focus-visible{outline:2px solid var(--butter);outline-offset:3px}" +
  ".bkm-pvcap{position:absolute;left:50%;bottom:clamp(14px,4vh,40px);transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:8px 16px;border-radius:999px;background:var(--paper);color:var(--ink);white-space:nowrap}" +
  ".bkm-count{position:absolute;right:18px;bottom:18px;z-index:4;color:var(--paper)}" +
  ".bkm-archtitle{position:absolute;left:18px;bottom:16px;z-index:4;margin:0;color:var(--paper);font-weight:800;font-size:15px}" +
  /* lightbox */
  ".bkm-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:24px;background:rgba(12,12,16,.86);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:bkm-fade .3s both}" +
  "@keyframes bkm-fade{from{opacity:0}}" +
  ".bkm-lb figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:14px}" +
  ".bkm-lb img{display:block;width:min(560px,82vw,64vh);height:auto;aspect-ratio:1;object-fit:cover;border-radius:4px;animation:bkm-pop .5s cubic-bezier(.2,1.4,.4,1) both}" +
  "@keyframes bkm-pop{from{transform:scale(.6);opacity:0}}" +
  ".bkm-lb figcaption{display:flex;gap:16px;align-items:center;color:var(--paper)}" +
  ".bkm-lbbtn{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1.5px solid var(--paper);background:none;color:var(--paper);cursor:pointer;font:inherit;font-size:18px}" +
  ".bkm-lbbtn:focus-visible{outline:2px solid var(--butter);outline-offset:3px}" +
  /* context label (the system cursor stays, as on the reference) */
  ".bkm-cursor{display:none;position:fixed;left:0;top:0;z-index:90;pointer-events:none}" +
  ".bkm-clab{position:absolute;left:16px;top:16px;padding:6px 10px;border-radius:999px;background:var(--butter);color:var(--deep);white-space:nowrap;opacity:0;transform:scale(.5);transform-origin:0 0;transition:transform .3s cubic-bezier(.2,1.5,.4,1),opacity .15s}" +
  ".bkm-cursor[data-label] .bkm-clab{opacity:1;transform:none}" +
  "@media (hover:hover) and (pointer:fine){.bkm-cursor{display:block}}" +
  "@media (prefers-reduced-motion:reduce){.bkm-root *{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}"

/* ------------------------------------------------------------- helpers */

const f = (n: number) => (Math.round(n * 10) / 10).toString()
const bg = (i: number) => ({ backgroundImage: "var(--bk-" + i + ")" }) as CSSProperties

type El = HTMLElement | SVGElement

export default function ScrapWallArchive({ height = "100svh", items, title = "Archive", className, style }: ScrapWallArchiveProps) {
  const list = items && items.length ? items : defaultItems()
  const n = list.length
  const rootRef = useRef(null as HTMLElement | null)
  const stageRef = useRef(null as HTMLDivElement | null)
  const countRef = useRef(null as HTMLSpanElement | null)
  const cursorRef = useRef(null as HTMLDivElement | null)
  const labelRef = useRef(null as HTMLSpanElement | null)
  const titleId = "bkm-archive" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const [lb, setLb] = useState(-1)
  const [mode, setMode] = useState("preview")
  const [focus, setFocus] = useState(13 % n)
  const s = useRef({
    W: 0,
    H: 0,
    len: 0,
    n,
    cells: [] as El[],
    imgs: [] as El[],
    fine: false,
    still: false,
    ready: false,
    top: 0,
    last: 0,
    px: -1,
    py: -1,
    over: false,
    label: "",
    mode: "preview",
    gx: 0,
    gy: 0,
    dragX: 0,
    dragY: 0,
    dragging: false,
    lastP: 0,
    kinds: [] as number[],
    visible: true,
    raf: 0,
    cache: new WeakMap() as WeakMap<object, Record<string, string>>,
  })

  const put = (el: El | null | undefined, prop: string, val: string) => {
    if (!el) return
    const c = s.current.cache
    let m = c.get(el)
    if (!m) c.set(el, (m = {}))
    if (m[prop] === val) return
    m[prop] = val
    if (prop.charCodeAt(0) === 45) el.style.setProperty(prop, val)
    else (el.style as unknown as Record<string, string>)[prop] = val
  }
  const flag = (el: El | null | undefined, name: string, on: boolean) => {
    if (!el) return
    if (on !== el.hasAttribute(name)) on ? el.setAttribute(name, "") : el.removeAttribute(name)
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.current.still = rm.matches
      s.current.fine = fp.matches
      schedule()
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
    }
  }, [])

  // a new set of pictures: every cell repaints, and the preview stays in range
  useEffect(() => {
    const st = s.current
    st.n = n
    st.kinds = []
    setFocus((k) => k % n)
    schedule()
  }, [list])

  // ---- the frame: one layout read (the root's box), then writes only
  const frame = (now: number) => {
    const st = s.current
    st.raf = 0
    const root = rootRef.current
    if (!root || !st.H) return
    const dt = st.last ? Math.min(64, now - st.last) : 16
    st.last = now
    const rect = root.getBoundingClientRect()
    st.top = !st.ready || st.still ? rect.top : approach(st.top, rect.top, dt, 80)
    st.ready = true
    const top = st.top
    const H = st.H
    const W = st.W
    let busy = Math.abs(top - rect.top) > 0.4

    // a preview that zooms out to an endless grid; scroll pans it down, drag pans it anywhere
    if (top < H && top + st.len > 0) {
      const p = st.still ? 0.5 : progressFrom(top, st.len, H)
      if (Math.abs(p - st.lastP) > 0.004 && st.mode === "preview" && p > GRID_AT) {
        st.mode = "grid"
        setMode("grid")
      } else if (p <= GRID_AT * 0.5 && st.mode === "grid" && !st.still) {
        st.mode = "preview"
        setMode("preview")
      }
      st.lastP = p
      const pitch = pitchFor(W)
      const ph = pitch * ROW
      const ty = st.dragY - gridPanAt(p) * ph
      st.gx = st.still ? st.dragX : approach(st.gx, st.dragX, dt, 90)
      st.gy = st.still ? ty : approach(st.gy, ty, dt, 90)
      if (Math.abs(st.gx - st.dragX) > 0.3 || Math.abs(st.gy - ty) > 0.3) busy = true
      const ox = wrap(st.gx, pitch)
      const oy = wrap(st.gy, ph)
      const c0 = Math.floor(-st.gx / pitch)
      const r0 = Math.floor(-st.gy / ph)
      for (let r = 0; r < POOL_R; r++)
        for (let c = 0; c < POOL_C; c++) {
          const k = r * POOL_C + c
          const cell = st.cells[k]
          if (!cell) continue
          const lr = r0 + r - 1
          const shift = lr & 1 ? pitch * 0.5 : 0
          put(cell, "transform", "translate3d(" + f(ox + (c - 1) * pitch + shift - pitch * 0.5) + "px," + f(oy + (r - 1) * ph) + "px,0)")
          const kind = cellKind(c0 + c - 1, lr, st.n)
          if (st.kinds[k] !== kind) {
            st.kinds[k] = kind
            put(st.imgs[k], "backgroundImage", "var(--bk-" + kind + ")")
            put(st.imgs[k], "aspectRatio", SHAPES[(kind + lr + 6) % SHAPES.length])
            cell.setAttribute("data-k", String(kind))
          }
        }
      const txt = countAt(p)
      const count = countRef.current
      if (count && count.textContent !== txt) count.textContent = txt
    }

    // the context label (mouse only; the system cursor stays)
    if (st.fine && st.over) put(cursorRef.current, "transform", "translate3d(" + f(st.px) + "px," + f(st.py) + "px,0)")

    if (busy && st.visible) schedule()
  }
  const schedule = () => {
    const st = s.current
    if (!st.raf && typeof window !== "undefined") st.raf = window.requestAnimationFrame(frame)
  }

  // ---- measure: the track, the stage, the cell size (resize only)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const st = s.current
      const stage = stageRef.current
      st.W = root.offsetWidth
      st.H = stage ? stage.offsetHeight : 0
      st.len = root.offsetHeight
      st.cells = Array.from(root.querySelectorAll("[data-cell]")) as El[]
      st.imgs = st.cells.map((c) => c.firstElementChild as El)
      st.kinds = []
      const pitch = pitchFor(st.W)
      for (const c of st.cells) {
        put(c, "width", f(pitch) + "px")
        put(c, "height", f(pitch * ROW) + "px")
      }
      schedule()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const onScroll = () => schedule()
    window.addEventListener("scroll", onScroll, { passive: true })
    const io = new IntersectionObserver((entries) => {
      s.current.visible = entries.some((x) => x.isIntersecting)
      if (s.current.visible) schedule()
    })
    io.observe(root)
    return () => {
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      const st = s.current
      if (st.raf) window.cancelAnimationFrame(st.raf)
      st.raf = 0
    }
  }, [])
  useEffect(() => {
    s.current.mode = mode
  }, [mode])

  // ---- lightbox keys
  useEffect(() => {
    if (lb < 0) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setLb(-1)
      else if (ev.key === "ArrowRight") setLb((i) => (i + 1) % n)
      else if (ev.key === "ArrowLeft") setLb((i) => (i + n - 1) % n)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lb, n])

  // ---- pointer: the context label follows a mouse
  const onMove = (ev: ReactPointerEvent<HTMLElement>) => {
    if (ev.pointerType !== "mouse") return
    const st = s.current
    st.px = ev.clientX
    st.py = ev.clientY
    st.over = true
    const t = ev.target as Element
    const hit = t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
    const label = hit ? hit.getAttribute("data-cursor") || "" : ""
    if (label !== st.label) {
      st.label = label
      if (labelRef.current) labelRef.current.textContent = label
      flag(cursorRef.current, "data-label", !!label)
    }
    schedule()
  }
  const onLeave = (ev: ReactPointerEvent<HTMLElement>) => {
    const st = s.current
    if (ev.pointerType === "mouse") st.over = false
    flag(cursorRef.current, "data-label", false)
    st.label = ""
    schedule()
  }

  // ---- the grid: drag to pan (mouse; touch scrolls the page as normal)
  const gridDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse" || ev.button !== 0) return
    const st = s.current
    st.dragging = false
    const sx = ev.clientX
    const sy = ev.clientY
    const bx = st.dragX
    const by = st.dragY
    const move = (e: PointerEvent) => {
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (!st.dragging && Math.abs(dx) + Math.abs(dy) > 5) st.dragging = true
      st.dragX = bx + dx
      st.dragY = by + dy
      schedule()
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.setTimeout(() => (st.dragging = false), 0)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }
  const openCell = (ev: { currentTarget: Element }) => {
    if (s.current.dragging) return
    const k = Number(ev.currentTarget.getAttribute("data-k") || 0)
    setFocus(k)
    s.current.mode = "preview"
    setMode("preview")
  }

  const vars = {} as Record<string, string>
  list.forEach((it, i) => (vars["--bk-" + i] = "url(" + JSON.stringify(it.src) + ")"))
  const rootStyle = { ...vars, height: "calc(" + height + " * " + TRACK.archive + ")", ...style } as CSSProperties
  const cur = list[focus % n]
  const open = lb >= 0 && lb < n ? list[lb] : null

  return (
    <section
      ref={rootRef}
      className={"bkm-root bkm-track bkm-arch" + (className ? " " + className : "")}
      data-mode={mode}
      style={rootStyle}
      aria-labelledby={titleId}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{FONTS + CSS}</style>
      <div ref={stageRef} className="bkm-stage bkm-stars" style={{ height }} onPointerDown={gridDown}>
        <div className="bkm-grid" aria-hidden={mode !== "grid"}>
          {Array.from({ length: POOL_C * POOL_R }, (_, k) => (
            <button key={k} type="button" className="bkm-cell" data-cell="" data-k="0" data-cursor="Look closer" tabIndex={mode === "grid" && k % 9 === 4 && k < 80 ? 0 : -1} aria-label="Open this scrap" onClick={openCell}>
              <i />
            </button>
          ))}
        </div>
        <div className="bkm-pv">
          <div className="bkm-pvrow">
            {rowFrom(3, focus + 1, n).map((k, j) => (
              <button key={"l" + j} type="button" aria-label={"Show " + list[k].name} data-cursor="Show" style={{ ...bg(k), right: "calc(50% + min(31.5vh, 41vw) * .75 + " + (5 + j * 13) + "vw)" }} onClick={() => setFocus(k)} tabIndex={mode === "preview" ? 0 : -1} />
            ))}
            {rowFrom(3, focus + 3, n).map((k, j) => (
              <button key={"r" + j} type="button" aria-label={"Show " + list[k].name} data-cursor="Show" style={{ ...bg(k), left: "calc(50% + min(31.5vh, 41vw) * .75 + " + (5 + j * 13) + "vw)" }} onClick={() => setFocus(k)} tabIndex={mode === "preview" ? 0 : -1} />
            ))}
          </div>
          <button type="button" className="bkm-pvbig bkm-hit" style={bg(focus % n)} aria-label={"Open " + cur.name + " full size"} data-cursor="Open" onClick={() => setLb(focus % n)} tabIndex={mode === "preview" ? 0 : -1} />
          <span className="bkm-pvcap bkm-mono">{cur.name} · scroll for the wall</span>
        </div>
        <h2 id={titleId} className="bkm-archtitle">
          {title}
        </h2>
        <span ref={countRef} className="bkm-count bkm-mono" aria-hidden="true">
          {countAt(0)}
        </span>
      </div>

      {open && (
        <div className="bkm-lb" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setLb(-1)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img key={lb} src={open.src} alt={open.name} width={560} height={560} />
            <figcaption>
              <button type="button" className="bkm-lbbtn" aria-label="Previous" onClick={() => setLb((i) => (i + n - 1) % n)}>
                ←
              </button>
              <span className="bkm-mono">
                {open.name} · {lb + 1}/{n}
              </span>
              <button type="button" className="bkm-lbbtn" aria-label="Next" onClick={() => setLb((i) => (i + 1) % n)}>
                →
              </button>
              <button type="button" className="bkm-lbbtn" aria-label="Close" onClick={() => setLb(-1)}>
                ×
              </button>
            </figcaption>
          </figure>
        </div>
      )}

      <div ref={cursorRef} className="bkm-cursor" aria-hidden="true">
        <span ref={labelRef} className="bkm-clab bkm-mono" />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- fonts + pictures */

const FONTS =
  "@font-face{font-family:BkmSans;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}" +
  "@font-face{font-family:BkmSans;font-weight:700;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}" +
  "@font-face{font-family:BkmMono;font-weight:400 700;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}"

/** The drawings, served full-size from the author's site (embedding them would break 21st's 200 kB file limit). */
const IMG_BASE = "https://kedhar-components.pages.dev/bunkum/"
const IMG: Record<string, string> = {
  a0: IMG_BASE + "a0.webp",
  a1: IMG_BASE + "a1.webp",
  a2: IMG_BASE + "a2.webp",
  a3: IMG_BASE + "a3.webp",
  a4: IMG_BASE + "a4.webp",
  a5: IMG_BASE + "a5.webp",
  a6: IMG_BASE + "a6.webp",
  a7: IMG_BASE + "a7.webp",
  a8: IMG_BASE + "a8.webp",
  b0: IMG_BASE + "b0.webp",
  b1: IMG_BASE + "b1.webp",
  b2: IMG_BASE + "b2.webp",
  b3: IMG_BASE + "b3.webp",
  b4: IMG_BASE + "b4.webp",
  b5: IMG_BASE + "b5.webp",
  b6: IMG_BASE + "b6.webp",
  b7: IMG_BASE + "b7.webp",
  b8: IMG_BASE + "b8.webp",
}
