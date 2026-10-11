"use client"

import * as React from "react"
import LedStatusSign, { type LedFinish, type LedPaletteName, type LedTransition } from "@/components/ui/led-status-sign"

const PALETTES: LedPaletteName[] = ["crimson", "amber", "lime", "ice", "violet", "mono"]
const SWATCH: Record<LedPaletteName, string> = {
  crimson: "#e0222c",
  amber: "#ef8410",
  lime: "#3fbf2e",
  ice: "#2479ee",
  violet: "#9534ea",
  mono: "#8a8a92",
}
const FINISHES: LedFinish[] = ["silver", "graphite", "white"]
const TRANSITIONS: LedTransition[] = ["roll", "wipe", "dissolve", "cut"]
const ICONS = ["mic", "phone", "video", "coffee", "focus", "dnd", "check", "moon", "heart", "rec", "music"] as const

// Make it yours: type a status, pick an icon, an ink, a finish and a transition.
export default function DemoCustom() {
  const [text, setText] = React.useState("ON CALL")
  const [icon, setIcon] = React.useState<(typeof ICONS)[number]>("mic")
  const [palette, setPalette] = React.useState<LedPaletteName>("crimson")
  const [finish, setFinish] = React.useState<LedFinish>("silver")
  const [transition, setTransition] = React.useState<LedTransition>("roll")
  const [effect, setEffect] = React.useState<"auto" | "blink" | "pulse" | "scroll">("auto")

  const statuses = React.useMemo(
    () => [
      { text: text || " ", icon, effect },
      { text: "BACK IN 5", icon: "coffee" as const },
      { text: "HEADS DOWN", icon: "focus" as const },
    ],
    [text, icon, effect],
  )

  const chip =
    "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
  const active = "!bg-black !text-white dark:!bg-white dark:!text-black"

  return (
    <div className="w-full">
      <LedStatusSign
        statuses={statuses}
        palette={palette}
        finish={finish}
        transition={transition}
        onTextChange={(i, t) => i === 0 && setText(t)}
      >
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-6">
          <input
            value={text}
            maxLength={40}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            aria-label="Status text"
            className="w-full max-w-xs rounded-full border border-black/15 bg-white/70 px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.25em] text-black outline-none backdrop-blur focus:border-black/40 dark:border-white/15 dark:bg-black/50 dark:text-white dark:focus:border-white/40"
          />
          <div className="flex max-w-3xl flex-wrap justify-center gap-1.5">
            {ICONS.map((name) => (
              <button key={name} type="button" onClick={() => setIcon(name)} className={chip + (icon === name ? " " + active : "")}>
                {name}
              </button>
            ))}
          </div>
          <div className="flex max-w-3xl flex-wrap items-center justify-center gap-1.5">
            {PALETTES.map((p) => (
              <button
                key={p}
                type="button"
                aria-label={p}
                title={p}
                onClick={() => setPalette(p)}
                className={"size-6 rounded-full border-2 transition-transform hover:scale-110 " + (palette === p ? "border-black dark:border-white" : "border-transparent")}
                style={{ background: SWATCH[p] }}
              />
            ))}
            <span className="mx-1" />
            {FINISHES.map((f) => (
              <button key={f} type="button" onClick={() => setFinish(f)} className={chip + (finish === f ? " " + active : "")}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex max-w-3xl flex-wrap justify-center gap-1.5">
            {TRANSITIONS.map((t) => (
              <button key={t} type="button" onClick={() => setTransition(t)} className={chip + (transition === t ? " " + active : "")}>
                {t}
              </button>
            ))}
            <span className="mx-1" />
            {(["auto", "blink", "pulse", "scroll"] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEffect(e)} className={chip + (effect === e ? " " + active : "")}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </LedStatusSign>
    </div>
  )
}
