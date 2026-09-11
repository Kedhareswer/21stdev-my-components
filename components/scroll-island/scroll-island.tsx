"use client"

import * as React from "react"

export type ScrollIslandItem = {
  /** Stable key, also the value handed to `onSelect`. */
  id: string
  /**
   * The glyph shown in the closed rail. Anything inline — an SVG, an emoji, a
   * single character. Sized to 18x18 by the rail.
   */
  icon?: React.ReactNode
  /**
   * Plain text. Appears beside the glyph when the island is open, and is the
   * button's accessible name at every size, so it is required even when the
   * island is closed and the text is clipped.
   */
  label: string
  /** Right-aligned secondary text on the open row — a value, a shortcut, a count. */
  meta?: string
  /** Renders with the accent colour and an active dot. */
  active?: boolean
  onSelect?: (id: string) => void
}

export type ScrollIslandProps = {
  /** Defaults to a small demo set so the component renders bare. */
  items?: ScrollIslandItem[]
  /**
   * Rich content pinned above the rows on the open panel — a now-playing card,
   * a preview, a chart. Hidden entirely while closed.
   */
  children?: React.ReactNode
  /** Which edge it clings to. */
  side?: "left" | "right"
  /** Width of the closed rail, in px. Also the diameter of its glyph buttons. */
  railWidth?: number
  /** Width of the open panel, in px. */
  openWidth?: number
  /** Live HH:MM at the foot of the rail. */
  clock?: boolean
  /** Accent for active rows, the clock, and the focus ring. */
  accent?: string
  /**
   * Start pinned open. The island is still hover- and focus-driven; this only
   * sets the initial pinned state.
   */
  defaultPinned?: boolean
  /** Distance from the viewport edge, in px. */
  inset?: number
  "aria-label"?: string
  className?: string
}

const DEFAULT_ITEMS: ScrollIslandItem[] = [
  {
    id: "play",
    label: "Now playing",
    meta: "Pink + White",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 18.5a2.5 2.5 0 1 1-2-2.45V6.2l10-2v9.3a2.5 2.5 0 1 1-2-2.45V6.65l-6 1.2z" />
      </svg>
    ),
  },
  {
    id: "brightness",
    label: "Brightness",
    meta: "70%",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Notes",
    meta: "3",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 3h9l5 5v13H5z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    id: "focus",
    label: "Focus mode",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

const styles = `
.sil {
  position: fixed;
  top: 50%;
  z-index: 60;
  display: flex;
  transform: translateY(-50%);
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  --sil-rail: 44px;
  --sil-open: 268px;
  --sil-accent: #1E90FF;
  --sil-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
.sil, .sil * { box-sizing: border-box; }
.sil img { max-width: none; }
.sil--right { right: var(--sil-inset, 12px); }
.sil--left { left: var(--sil-inset, 12px); }

.sil__card {
  width: var(--sil-rail);
  padding: 8px 0;
  border-radius: calc(var(--sil-rail) / 2);
  background: #0A0A0A;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 12px 34px rgba(0, 0, 0, 0.42),
    0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  cursor: pointer;
  transition:
    width 360ms var(--sil-ease),
    border-radius 360ms var(--sil-ease),
    padding 360ms var(--sil-ease);
}
.sil[data-open="true"] .sil__card {
  width: var(--sil-open);
  padding: 10px;
  border-radius: 20px;
  cursor: default;
}

/* Rich content collapses to nothing without a measured height: 0fr -> 1fr is
   the only way to transition to an auto height without JS. */
.sil__head {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 360ms var(--sil-ease), opacity 200ms linear;
  opacity: 0;
}
.sil[data-open="true"] .sil__head {
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 360ms var(--sil-ease), opacity 240ms linear 120ms;
}
.sil__head > div { overflow: hidden; min-height: 0; }
.sil__headinner { padding-bottom: 8px; }

.sil__items { margin: 0; padding: 0; list-style: none; }

.sil__row {
  display: flex;
  align-items: center;
  /* Closed, the label and meta shrink to zero but the gap does not, which would
     push the glyph off-centre in the rail. */
  justify-content: center;
  gap: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: #E9E9E9;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  text-align: left;
  border-radius: 10px;
  cursor: pointer;
  transition: background 160ms linear, padding 360ms var(--sil-ease), gap 360ms var(--sil-ease);
}
.sil[data-open="true"] .sil__row {
  padding: 8px;
  justify-content: flex-start;
  gap: 10px;
}
.sil__row:hover { background: rgba(255, 255, 255, 0.09); }
.sil__row:focus-visible {
  outline: 2px solid var(--sil-accent);
  outline-offset: 1px;
}
.sil__row[data-active="true"] { color: var(--sil-accent); }

.sil__ico {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--sil-rail) - 16px);
  height: calc(var(--sil-rail) - 16px);
  border-radius: 50%;
  transition: width 360ms var(--sil-ease), height 360ms var(--sil-ease), background 160ms linear;
}
.sil[data-open="true"] .sil__ico {
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.08);
}
.sil__row[data-active="true"] .sil__ico { background: rgba(30, 144, 255, 0.16); }
.sil__ico svg { width: 17px; height: 17px; display: block; }

/* Clipped rather than removed, so the row keeps a sane hit area while closed
   and the accessible name never depends on the open state. */
.sil__lbl {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 160ms linear;
}
/* Must be shrinkable while closed. With flex: none a long meta string keeps its
   intrinsic width at zero opacity and shoves the glyph out of the rail. */
.sil__meta {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  color: #8A8A8A;
  opacity: 0;
  transition: opacity 160ms linear;
}
.sil[data-open="true"] .sil__meta { flex: none; }
.sil[data-open="true"] .sil__lbl,
.sil[data-open="true"] .sil__meta { opacity: 1; transition-delay: 110ms; }

.sil__dot {
  position: absolute;
  right: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--sil-accent);
  transition: opacity 160ms linear;
}
.sil[data-open="true"] .sil__dot { opacity: 0; }

.sil__clock {
  margin-top: 6px;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #F2F2F2;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  letter-spacing: 0.2px;
  transition: font-size 360ms var(--sil-ease), color 200ms linear;
}
.sil[data-open="true"] .sil__clock {
  font-size: 12px;
  color: var(--sil-accent);
  text-align: left;
  padding-left: 8px;
}
.sil__clock span { display: block; font-size: 8px; opacity: 0.7; font-weight: 500; }
.sil[data-open="true"] .sil__clock span { display: inline; margin-left: 4px; font-size: 10px; }

@media (prefers-reduced-motion: reduce) {
  .sil__card, .sil__head, .sil__row, .sil__ico,
  .sil__lbl, .sil__meta, .sil__dot, .sil__clock {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
`

/** HH:MM, refreshed on the minute. Null until mounted, so SSR and the client agree. */
function useClock(enabled: boolean) {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    if (!enabled) return
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [enabled])
  if (!now) return null
  const h = now.getHours()
  return {
    time: String(h % 12 || 12).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
    suffix: h < 12 ? "AM" : "PM",
  }
}

export default function ScrollIsland({
  items = DEFAULT_ITEMS,
  children,
  side = "right",
  railWidth = 44,
  openWidth = 268,
  clock = true,
  accent = "#1E90FF",
  defaultPinned = false,
  inset = 12,
  "aria-label": ariaLabel = "Quick controls",
  className,
}: ScrollIslandProps) {
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [pinned, setPinned] = React.useState(defaultPinned)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const open = hovered || focused || pinned
  const time = useClock(clock)

  // Escape unpins and drops focus, so a keyboard or touch user is never stuck
  // with the panel held open over the page.
  React.useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setPinned(false)
      const active = document.activeElement
      if (active instanceof HTMLElement && rootRef.current?.contains(active)) active.blur()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [pinned])

  // Pointer-driven open is a desktop affordance; taps have to pin instead.
  React.useEffect(() => {
    if (!pinned) return
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [pinned])

  return (
    <>
      <style>{styles}</style>
      <div
        ref={rootRef}
        className={"sil sil--" + side + (className ? " " + className : "")}
        data-open={open}
        style={
          {
            "--sil-rail": railWidth + "px",
            "--sil-open": openWidth + "px",
            "--sil-accent": accent,
            "--sil-inset": inset + "px",
          } as React.CSSProperties
        }
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false)
        }}
      >
        <div
          className="sil__card"
          role="group"
          aria-label={ariaLabel}
          onClick={() => {
            if (!open) setPinned(true)
          }}
        >
          {children ? (
            <div className="sil__head" aria-hidden={!open}>
              <div>
                <div className="sil__headinner">{children}</div>
              </div>
            </div>
          ) : null}

          <ul className="sil__items">
            {items.map((item) => (
              <li key={item.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <button
                  type="button"
                  className="sil__row"
                  data-active={item.active ? "true" : "false"}
                  aria-label={item.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!open) {
                      setPinned(true)
                      return
                    }
                    item.onSelect?.(item.id)
                  }}
                >
                  <span className="sil__ico">{item.icon}</span>
                  <span className="sil__lbl">{item.label}</span>
                  {item.meta ? <span className="sil__meta">{item.meta}</span> : null}
                </button>
                {item.active ? <span className="sil__dot" aria-hidden="true" /> : null}
              </li>
            ))}
          </ul>

          {clock ? (
            <div className="sil__clock" aria-hidden="true">
              {time ? time.time : "--:--"}
              <span>{time ? time.suffix : ""}</span>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
