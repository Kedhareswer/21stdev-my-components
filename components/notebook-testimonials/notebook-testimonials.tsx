"use client"

import * as React from "react"

/**
 * Notebook Testimonials — quotes on torn-out notebook paper, pinned up at
 * angles.
 *
 * Two bits of CSS do the work. The punched holes are a **mask**: a solid
 * rectangle minus a column of circles, composited with `subtract`, so the
 * holes are genuinely missing from the sheet rather than painted on — you can
 * see whatever is behind the card through them. The ruled lines are a
 * repeating gradient whose pitch is the same value as the text's
 * `line-height`, which is the only reason the writing sits *on* the rules
 * instead of drifting across them as the quote gets longer.
 *
 * Self-contained: React is the only import, every style is inline, and there
 * is no `@import` — see `fontFamily` for the typewriter face.
 */

export type Testimonial = {
  quote: string
  /** Shown under the stars. A handle, a name, whatever it is. */
  handle?: string
  /** 0–5. Omit for no stars. Halves are rounded down. */
  rating?: number
  date?: string
  /** Overrides the cycled accent for this card. Any CSS colour. */
  accent?: string
}

export type NotebookTestimonialsProps = {
  items: Testimonial[]
  /** Card width in px. Everything else is derived from it. */
  cardWidth?: number
  /** Ruled-line pitch in px. Also the text's line-height — they must match. */
  rowSize?: number
  /** Minimum ruled lines per sheet, so a short quote still looks like paper. */
  minRows?: number
  /** Largest tilt in degrees. 0 lays them flat. */
  tilt?: number
  /** Which arrangement of tilts. Any integer; change it to reshuffle. */
  seed?: number
  /**
   * How far neighbouring cards overlap, in px. Kept at 0 by default: the
   * stars and the date sit against the right edge, and a rotated neighbour
   * sweeping over that corner hides them.
   */
  overlap?: number
  punchHoles?: boolean
  /** Straighten and lift a card on hover. */
  interactive?: boolean
  paper?: string
  ink?: string
  /** Accents cycled across the cards. */
  accents?: string[]
  /**
   * The pen used Special Elite off Google Fonts. A component cannot `@import`
   * — that belongs to the host page — so this defaults to a typewriter stack
   * that degrades to Courier. Load Special Elite in your app and it is used.
   */
  fontFamily?: string
  className?: string
}

// #region layout
/**
 * A stable pseudo-random number in [0, 1) for a card. Deterministic, so the
 * arrangement is identical on the server and the client — `Math.random()` here
 * would tilt every card differently during hydration.
 */
export const shuffle = (index: number, seed: number): number => {
  let h = (index + 1) * 374761393 + seed * 668265263
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * The tilt for one card. Signs alternate so the row zig-zags rather than
 * leaning as a block, and the magnitude never falls below 45% of the maximum —
 * a card that lands at nearly zero among tilted ones reads as a bug, not as
 * chance.
 */
export const tiltFor = (index: number, seed: number, max: number): number => {
  if (max === 0) return 0
  const sign = index % 2 === 0 ? -1 : 1
  return sign * (0.45 + 0.55 * shuffle(index, seed)) * max
}

/** Accent for a card: its own if it has one, else the palette, cycled. */
export const accentFor = (
  item: { accent?: string },
  index: number,
  palette: string[],
): string =>
  item.accent ?? (palette.length > 0 ? palette[index % palette.length] : "currentColor")
// #endregion

const ACCENTS = ["indianred", "slateblue", "seagreen", "goldenrod", "steelblue"]

const STARS = "★★★★★"

export default function NotebookTestimonials({
  items,
  cardWidth = 320,
  rowSize = 36,
  minRows = 5,
  tilt = 5,
  seed = 1,
  overlap = 0,
  punchHoles = true,
  interactive = true,
  paper = "#f1efeb",
  ink = "#222222",
  accents = ACCENTS,
  fontFamily = '"Special Elite", "Courier New", Courier, ui-monospace, monospace',
  className = "",
}: NotebookTestimonialsProps) {
  // The holes sit in the left margin, so the text has to start to the right of
  // them; deriving both from one number keeps them from ever colliding.
  const holeSize = Math.round(rowSize / 2)
  const gutter = punchHoles ? holeSize + 28 : 28

  return (
    <div
      className={"flex flex-wrap items-start justify-center " + className}
      style={{ color: ink, fontFamily }}
    >
      {items.map((item, i) => {
        const accent = accentFor(item, i, accents)
        const angle = tiltFor(i, seed, tilt)
        const stars = Math.max(0, Math.min(5, Math.floor(item.rating ?? 0)))

        return (
          <figure
            key={i}
            className="group relative z-0 m-0 shrink-0 hover:z-10"
            style={{
              width: cardWidth,
              // The shadow lives out here, on the wrapper: a filter on the
              // masked sheet itself would trace every punched hole.
              filter: "drop-shadow(2px 3px 10px rgba(0,0,0,0.16))",
              marginInline: -overlap / 2,
              marginBlock: 8,
            }}
          >
            <div
              className={
                "relative transition-transform duration-300 ease-out motion-reduce:transition-none " +
                (interactive ? "group-hover:!rotate-0 group-hover:-translate-y-2.5" : "")
              }
              style={{
                rotate: angle + "deg",
                background: paper,
                paddingTop: rowSize * 2,
                paddingBottom: rowSize,
                paddingLeft: gutter,
                paddingRight: 28,
                // A solid sheet, minus a column of circles. `subtract` is what
                // makes them holes rather than dots — the page behind shows
                // through. Safari needs the legacy keyword first.
                ...(punchHoles
                  ? {
                      WebkitMaskImage:
                        "linear-gradient(#000, #000), radial-gradient(circle, #000 40%, transparent 0)",
                      WebkitMaskRepeat: "no-repeat, repeat-y",
                      WebkitMaskPosition: "center, " + holeSize + "px " + holeSize / 2 + "px",
                      WebkitMaskSize: "100% 100%, " + holeSize + "px " + rowSize + "px",
                      WebkitMaskComposite: "source-out",
                      maskImage:
                        "linear-gradient(#000, #000), radial-gradient(circle, #000 40%, transparent 0)",
                      maskRepeat: "no-repeat, repeat-y",
                      maskPosition: "center, " + holeSize + "px " + holeSize / 2 + "px",
                      maskSize: "100% 100%, " + holeSize + "px " + rowSize + "px",
                      maskComposite: "subtract",
                    }
                  : {}),
              }}
            >
              <figcaption
                className="absolute right-6 top-5 flex flex-col items-end gap-1 text-right"
                style={{
                  color: accent,
                  fontSize: 14,
                  lineHeight: 1.2,
                  // A long handle would otherwise run off the sheet, where the
                  // mask clips it mid-letter.
                  maxWidth: cardWidth - gutter - 32,
                }}
              >
                {stars > 0 && (
                  <span role="img" aria-label={stars + " out of 5"}>
                    {STARS.slice(0, stars)}
                  </span>
                )}
                {item.handle && <span>{item.handle}</span>}
              </figcaption>

              <blockquote
                className="m-0 p-0"
                style={{
                  // The rules and the text share one number. That is the whole
                  // trick: any other pairing and the writing floats off them.
                  lineHeight: rowSize + "px",
                  minHeight: rowSize * minRows,
                  fontSize: Math.round(rowSize * 0.56),
                  textWrap: "pretty",
                  backgroundImage:
                    "repeating-linear-gradient(transparent 0 " +
                    (rowSize - 1) +
                    "px, rgba(0,0,0,0.13) 0 " +
                    rowSize +
                    "px)",
                }}
              >
                {item.quote}
              </blockquote>

              {item.date && (
                <div className="absolute bottom-3 right-6" style={{ fontSize: 12, opacity: 0.8 }}>
                  {item.date}
                </div>
              )}
            </div>
          </figure>
        )
      })}
    </div>
  )
}
