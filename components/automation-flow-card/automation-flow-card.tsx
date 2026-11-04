"use client"

import { useEffect, useId, useRef, useState } from "react"

export type FlowStep = { label: string; icon?: FlowIcon }
export type FlowIcon = "mail" | "spark" | "tag" | "chat" | "bolt" | "doc"
export type FlowStat = { label: string; value: string }
export type FlowPerson = { name: string; photo: string }

export type AutomationFlowCardProps = {
  title: string
  description?: string
  /** e.g. "Edited 5 days ago". */
  edited?: string
  /** Exactly four steps read best: one trigger, one action, two branches. */
  steps?: FlowStep[]
  stats?: FlowStat[]
  people?: FlowPerson[]
  /** Extra collaborators beyond `people`, shown as "+N". */
  extraPeople?: number
  /** The integration chips bottom right. */
  integrations?: FlowIcon[]
  defaultActive?: boolean
  onActiveChange?: (active: boolean) => void
  menu?: { label: string; onSelect?: () => void; danger?: boolean }[]
  height?: string
  className?: string
}

const ICONS: Record<FlowIcon, string> = {
  mail: "M2.5 4.5h11v7h-11z M2.5 4.8 8 9l5.5-4.2",
  spark: "M8 2.5 9.3 6.7 13.5 8 9.3 9.3 8 13.5 6.7 9.3 2.5 8 6.7 6.7z",
  tag: "M2.5 2.5h5l6 6-5 5-6-6z M5.3 5.3h.01",
  chat: "M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z",
  bolt: "M9 2 3.5 9H8l-1 5 5.5-7H8z",
  doc: "M4 2.5h5.5L12 5v8.5H4z M9.5 2.5V5H12 M6 8h4 M6 10.5h4",
}

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const EASE = "cubic-bezier(.22,1,.36,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const SURFACE = "color-mix(in oklab,var(--color-foreground) 2.5%,var(--color-background))"
const LINE = "color-mix(in oklab,var(--color-foreground) 9%,transparent)"

const CSS =
  ".afc-stage{display:flex;align-items:center;justify-content:center;padding:48px 16px;box-sizing:border-box;background:var(--color-background);color:var(--color-foreground);font-family:" + SANS + "}" +
  ".afc-card{position:relative;width:100%;max-width:420px;border-radius:26px;background:" + SURFACE + ";" +
  "box-shadow:0 0 0 1px " + LINE + ",0 1px 0 color-mix(in oklab,#fff 50%,transparent) inset,0 2px 6px -2px rgba(15,10,40,.12),0 34px 60px -30px rgba(15,10,40,.45);" +
  "transition:transform .6s " + SPRING + ",box-shadow .6s;animation:afc-in .9s " + EASE + " both}" +
  "@keyframes afc-in{from{opacity:0;transform:translateY(26px) scale(.97)}to{opacity:1;transform:none}}" +
  ".afc-card:hover{transform:translateY(-4px)}" +
  ".afc-cover{position:relative;height:200px;border-radius:26px 26px 0 0;overflow:hidden;isolation:isolate;background:#160f38;margin:0}" +
  ".afc-blob{position:absolute;border-radius:50%;filter:blur(30px);mix-blend-mode:screen;opacity:.9;animation:afc-drift var(--d) ease-in-out infinite alternate}" +
  "@keyframes afc-drift{from{transform:translate(0,0) scale(1)}to{transform:translate(var(--x),var(--y)) scale(1.15)}}" +
  ".afc-cover::after{content:'';position:absolute;inset:0;z-index:1;background:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.2px) 0 0/14px 14px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 40%,#000 70%,transparent);mask-image:linear-gradient(180deg,transparent,#000 40%,#000 70%,transparent);pointer-events:none}" +
  ".afc-card[data-active=false] .afc-blob,.afc-card[data-active=false] .afc-pulse,.afc-card[data-active=false] .afc-node[data-k='0'] .afc-ping{animation-play-state:paused}" +
  ".afc-card[data-active=false] .afc-cover{filter:saturate(.25) brightness(.85)}" +
  ".afc-cover{transition:filter .6s}" +
  ".afc-wires{position:absolute;inset:0;z-index:2;width:100%;height:100%;overflow:visible}" +
  ".afc-wires path{fill:none;stroke:rgba(255,255,255,.28);stroke-width:1.4}" +
  ".afc-wires .afc-pulse{stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:14 400;stroke-dashoffset:14;filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 10px #ff7ad9);animation:afc-flow 3.2s linear infinite;animation-delay:var(--dl)}" +
  "@keyframes afc-flow{0%{stroke-dashoffset:14;opacity:1}50%{stroke-dashoffset:-260;opacity:1}51%,100%{stroke-dashoffset:-260;opacity:0}}" +
  ".afc-node{position:absolute;z-index:3;display:flex;align-items:center;gap:7px;padding:7px 10px 7px 7px;border-radius:12px;font:600 11.5px/1 " + SANS + ";color:#fff;white-space:nowrap;transform:translate(-50%,-50%);" +
  "background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 20px -8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.25);" +
  "animation:afc-pop .7s " + SPRING + " both;animation-delay:calc(var(--k) * 110ms + 350ms);transition:translate .6s " + SPRING + "}" +
  "@keyframes afc-pop{from{opacity:0;scale:.6}to{opacity:1;scale:1}}" +
  ".afc-card:hover .afc-node{translate:0 -3px}" +
  ".afc-card:hover .afc-node[data-k='1']{translate:0 -6px}" +
  ".afc-node b{display:grid;place-items:center;width:20px;height:20px;border-radius:7px;background:rgba(255,255,255,.95);color:#2a1a6e}" +
  ".afc-ping{position:absolute;inset:-1px;border-radius:12px;border:1px solid #fff;animation:afc-ping 3.2s " + EASE + " infinite;pointer-events:none}" +
  "@keyframes afc-ping{0%{opacity:.9;transform:scale(1)}40%,100%{opacity:0;transform:scale(1.35)}}" +
  ".afc-body{padding:16px 20px 18px}" +
  ".afc-meta{display:flex;align-items:center;gap:8px;font:500 12px/1 " + SANS + ";color:var(--color-muted-foreground)}" +
  ".afc-meta i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.6}" +
  ".afc-status{display:inline-flex;align-items:center;gap:6px}" +
  ".afc-status::before{content:'';width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.2)}" +
  ".afc-card[data-active=false] .afc-status::before{background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.2)}" +
  ".afc-tools{margin-left:auto;display:flex;align-items:center;gap:6px;position:relative}" +
  ".afc-switch{position:relative;width:34px;height:20px;border-radius:999px;border:0;padding:0;cursor:pointer;background:color-mix(in oklab,var(--color-foreground) 16%,transparent);transition:background .3s}" +
  ".afc-switch[aria-checked=true]{background:#22c55e}" +
  ".afc-switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .45s " + SPRING + "}" +
  ".afc-switch[aria-checked=true]::after{transform:translateX(14px)}" +
  ".afc-more{width:30px;height:30px;border-radius:9px;border:0;background:none;color:var(--color-muted-foreground);cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s}" +
  ".afc-more:hover,.afc-more[aria-expanded=true]{background:color-mix(in oklab,var(--color-foreground) 7%,transparent);color:var(--color-foreground)}" +
  ".afc-switch:focus-visible,.afc-more:focus-visible,.afc-menu button:focus-visible{outline:2px solid var(--color-foreground);outline-offset:2px}" +
  ".afc-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:10;min-width:160px;padding:5px;border-radius:14px;background:var(--color-background);" +
  "box-shadow:0 0 0 1px " + LINE + ",0 16px 34px -12px rgba(15,10,40,.35);transform-origin:top right;animation:afc-menu .35s " + SPRING + " both;list-style:none;margin:0}" +
  "@keyframes afc-menu{from{opacity:0;transform:scale(.9) translateY(-4px)}to{opacity:1;transform:none}}" +
  ".afc-menu button{width:100%;text-align:left;border:0;background:none;padding:9px 10px;border-radius:9px;font:500 13px/1 " + SANS + ";color:var(--color-foreground);cursor:pointer}" +
  ".afc-menu button:hover{background:color-mix(in oklab,var(--color-foreground) 6%,transparent)}" +
  ".afc-menu button[data-danger=true]{color:#e5484d}" +
  ".afc-title{font:650 19px/1.2 " + SANS + ";letter-spacing:-.02em;margin:12px 0 6px}" +
  ".afc-desc{font:400 13.5px/1.5 " + SANS + ";color:var(--color-muted-foreground);margin:0}" +
  ".afc-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:16px 0;border-radius:14px;box-shadow:0 0 0 1px " + LINE + "}" +
  ".afc-stats div{padding:11px 12px}" +
  ".afc-stats div+div{box-shadow:-1px 0 0 " + LINE + "}" +
  ".afc-stats dt{font:500 10px/1 " + MONO + ";letter-spacing:.12em;text-transform:uppercase;color:var(--color-muted-foreground);margin-bottom:7px}" +
  ".afc-stats dd{margin:0;font:650 16px/1 " + SANS + ";letter-spacing:-.02em;font-variant-numeric:tabular-nums}" +
  ".afc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:14px;border-top:1px solid " + LINE + "}" +
  ".afc-people{display:flex;align-items:center}" +
  ".afc-people span{position:relative;width:28px;height:28px;border-radius:50%;overflow:hidden;margin-left:-8px;box-shadow:0 0 0 2px " + SURFACE + ";transition:transform .45s " + SPRING + ",margin .45s " + SPRING + "}" +
  ".afc-people span:first-child{margin-left:0}" +
  ".afc-people:hover span{margin-left:-3px}.afc-people:hover span:first-child{margin-left:0}" +
  ".afc-people span:hover{transform:translateY(-3px)}" +
  ".afc-people img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".afc-people em{margin-left:6px;font:600 11.5px/1 " + SANS + ";font-style:normal;color:var(--color-muted-foreground)}" +
  ".afc-ints{display:flex}" +
  ".afc-ints span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;margin-left:-6px;box-shadow:0 0 0 2px " + SURFACE + "}" +
  ".afc-ints span:first-child{margin-left:0}" +
  "@media (prefers-reduced-motion:reduce){.afc-card,.afc-blob,.afc-node,.afc-ping,.afc-menu,.afc-wires .afc-pulse{animation:none}.afc-card,.afc-switch::after,.afc-node,.afc-people span{transition:none}.afc-card:hover{transform:none}.afc-wires .afc-pulse{opacity:0}}"

const INT_COLORS = ["#3b82f6", "#a855f7", "#ef4444", "#f59e0b", "#10b981", "#ec4899"]

function Icon({ name, size = 12 }: { name: FlowIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Node centres in percent of the cover, and the wires between them in a 400x200 box.
const POS = [
  [17, 50],
  [47, 50],
  [80, 27],
  [80, 73],
]
const WIRES = ["M68 100 C 120 100, 140 100, 188 100", "M188 100 C 250 100, 250 54, 320 54", "M188 100 C 250 100, 250 146, 320 146"]

export default function AutomationFlowCard({
  title,
  description,
  edited = "Edited 5 days ago",
  steps = [
    { label: "New email", icon: "mail" },
    { label: "Classify", icon: "spark" },
    { label: "Draft reply", icon: "doc" },
    { label: "Apply label", icon: "tag" },
  ],
  stats = [],
  people = [],
  extraPeople = 0,
  integrations = ["mail", "spark", "chat"],
  defaultActive = true,
  onActiveChange,
  menu = [{ label: "Duplicate" }, { label: "Rename" }, { label: "Delete", danger: true }],
  height = "100svh",
  className = "",
}: AutomationFlowCardProps) {
  const [active, setActive] = useState(defaultActive)
  const [open, setOpen] = useState(false)
  const toolsRef = useRef(null as HTMLDivElement | null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const toggle = () => {
    setActive((a) => {
      onActiveChange?.(!a)
      return !a
    })
  }

  return (
    <div className={"afc-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <article className="afc-card" data-active={active} aria-labelledby={id + "t"}>
        <figure className="afc-cover" aria-hidden="true">
          <span className="afc-blob" style={{ width: 260, height: 220, left: -60, top: -70, background: "#ff3d9a", ["--d" as string]: "9s", ["--x" as string]: "40px", ["--y" as string]: "30px" }} />
          <span className="afc-blob" style={{ width: 240, height: 220, right: -50, top: -40, background: "#ff9a3c", ["--d" as string]: "11s", ["--x" as string]: "-50px", ["--y" as string]: "40px" }} />
          <span className="afc-blob" style={{ width: 300, height: 200, left: 60, bottom: -110, background: "#2bb7ff", ["--d" as string]: "13s", ["--x" as string]: "30px", ["--y" as string]: "-30px" }} />
          <span className="afc-blob" style={{ width: 200, height: 180, right: 20, bottom: -90, background: "#7b4dff", ["--d" as string]: "10s", ["--x" as string]: "-30px", ["--y" as string]: "-20px" }} />
          <svg className="afc-wires" viewBox="0 0 400 200" preserveAspectRatio="none">
            {WIRES.map((d, k) => (
              <g key={k}>
                <path d={d} />
                <path className="afc-pulse" d={d} style={{ ["--dl" as string]: (k === 0 ? 0 : 1.1) + "s" }} />
              </g>
            ))}
          </svg>
          {steps.slice(0, 4).map((s, k) => (
            <span key={s.label + k} className="afc-node" data-k={k} style={{ left: POS[k][0] + "%", top: POS[k][1] + "%", ["--k" as string]: k }}>
              <b>
                <Icon name={s.icon ?? "bolt"} />
              </b>
              {s.label}
              {k === 0 && <i className="afc-ping" />}
            </span>
          ))}
        </figure>

        <div className="afc-body">
          <div className="afc-meta">
            <span>{edited}</span>
            <i aria-hidden="true" />
            <span className="afc-status">{active ? "Active" : "Paused"}</span>
            <div className="afc-tools" ref={toolsRef}>
              <button type="button" role="switch" className="afc-switch" aria-checked={active} aria-label={active ? "Pause workflow" : "Resume workflow"} onClick={toggle} />
              <button type="button" className="afc-more" aria-haspopup="menu" aria-expanded={open} aria-label="More actions" onClick={() => setOpen((o) => !o)}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="3.5" cy="8" r="1.4" fill="currentColor" />
                  <circle cx="8" cy="8" r="1.4" fill="currentColor" />
                  <circle cx="12.5" cy="8" r="1.4" fill="currentColor" />
                </svg>
              </button>
              {open && (
                <ul className="afc-menu" role="menu">
                  {menu.map((m) => (
                    <li key={m.label} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        data-danger={!!m.danger}
                        onClick={() => {
                          setOpen(false)
                          m.onSelect?.()
                        }}
                      >
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <h3 className="afc-title" id={id + "t"}>
            {title}
          </h3>
          {description && <p className="afc-desc">{description}</p>}
          {stats.length > 0 && (
            <dl className="afc-stats">
              {stats.slice(0, 3).map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="afc-foot" style={stats.length ? undefined : { marginTop: 16 }}>
            <div className="afc-people">
              {people.map((p) => (
                <span key={p.name} title={p.name}>
                  <img src={p.photo} alt={p.name} draggable={false} />
                </span>
              ))}
              {extraPeople > 0 && <em>+{extraPeople}</em>}
            </div>
            <div className="afc-ints" aria-label="Connected apps">
              {integrations.map((n, k) => (
                <span key={n + k} style={{ background: INT_COLORS[k % INT_COLORS.length] }} title={n}>
                  <Icon name={n} size={13} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
