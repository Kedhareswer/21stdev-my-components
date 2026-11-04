"use client"

import * as React from "react"

// Loading text with a travelling light. In "wave" each letter lifts a touch and
// catches the light as a crest passes through the line; in "sweep" a soft band
// of light glides across the letters without moving them. Pure CSS, one
// keyframe per mode, every letter on its own delay.

export type ShimmerWaveTextProps = {
  text: string
  variant?: "wave" | "sweep"
  /** Seconds for one pass through the line. */
  duration?: number
  /** Seconds between neighbouring letters. Defaults to spreading the crest over the line. */
  step?: number
  /** Resting colour. Defaults to the host's muted foreground. */
  color?: string
  /** Colour at the crest. Defaults to the host's foreground. */
  highlight?: string
  /** How far a letter lifts at the crest, in em (wave only). */
  lift?: number
  /** Stop the shimmer and show the text plainly. */
  active?: boolean
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3"
  className?: string
  style?: React.CSSProperties
}

// #region timing
/** Delay step so the crest crosses the whole line in about 60% of a pass. */
export function autoStep(len: number, duration: number): number {
  if (len <= 1) return 0
  return Math.round(((duration * 0.6) / (len - 1)) * 1000) / 1000
}

/**
 * Words of letters, each letter with its wave index. Words stay whole (so the
 * line only breaks between them); spaces take no delay of their own.
 */
export function letters(text: string): { ch: string; i: number }[][] {
  let i = 0
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Array.from(w).map((ch) => ({ ch, i: i++ })))
}
// #endregion

const CSS =
  ".swt-root{display:inline-block;color:var(--swt-base)}" +
  ".swt-w{display:inline-block;white-space:nowrap}" +
  ".swt-c{display:inline-block;will-change:transform}" +
  ".swt-wave .swt-c{animation:swt-wave var(--swt-d) cubic-bezier(.45,0,.4,1) infinite;animation-delay:calc(var(--i) * var(--swt-step))}" +
  ".swt-sweep .swt-c{animation:swt-sweep var(--swt-d) linear infinite;animation-delay:calc(var(--i) * var(--swt-step))}" +
  ".swt-off .swt-c{animation:none;color:var(--swt-hi)}" +
  "@keyframes swt-wave{0%,34%,100%{transform:translateY(0) scale(1);color:var(--swt-base);text-shadow:0 0 0 transparent}" +
  "12%{transform:translateY(calc(var(--swt-lift) * -1em)) scale(1.04);color:var(--swt-hi);text-shadow:0 .08em .5em color-mix(in oklab,var(--swt-hi) 40%,transparent)}" +
  "22%{transform:translateY(calc(var(--swt-lift) * .18em)) scale(.995);color:color-mix(in oklab,var(--swt-hi) 55%,var(--swt-base))}}" +
  "@keyframes swt-sweep{0%,30%,100%{color:var(--swt-base);text-shadow:0 0 0 transparent}" +
  "12%{color:var(--swt-hi);text-shadow:0 0 .45em color-mix(in oklab,var(--swt-hi) 35%,transparent)}}" +
  "@media (prefers-reduced-motion:reduce){.swt-wave .swt-c{animation-name:swt-sweep}}"

export default function ShimmerWaveText({
  text,
  variant = "wave",
  duration = 2.2,
  step,
  color,
  highlight,
  lift = 0.16,
  active = true,
  as = "span",
  className,
  style,
}: ShimmerWaveTextProps) {
  const ls = React.useMemo(() => letters(text), [text])
  const count = ls.reduce((n, w) => n + w.length, 0)
  const Tag = as
  return (
    <Tag
      className={"swt-root swt-" + (active ? variant : "off") + (className ? " " + className : "")}
      aria-label={text}
      role={as === "span" || as === "div" ? "status" : undefined}
      style={
        {
          "--swt-base": color || "var(--color-muted-foreground, #8a8a8a)",
          "--swt-hi": highlight || "var(--color-foreground, #111)",
          "--swt-d": duration + "s",
          "--swt-step": (step ?? autoStep(count, duration)) + "s",
          "--swt-lift": lift,
          ...style,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      {ls.map((w, k) => (
        <React.Fragment key={k}>
          {k ? " " : null}
          <span className="swt-w" aria-hidden="true">
            {w.map((l) => (
              <span className="swt-c" key={l.i} style={{ "--i": l.i } as React.CSSProperties}>
                {l.ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </Tag>
  )
}
