"use client"

import SilhouetteWrap, { SILHOUETTES } from "@/components/ui/silhouette-wrap"

/**
 * An illuminated page. The wyrm is carved out of the text block, not floated
 * beside it: every line is measured and set around its coil, its spines and its
 * wing. Scroll and it shifts through the column, and the whole page is set
 * again — with an illuminated initial, a rubricated opening and embers coming
 * off the beast.
 *
 * Everything here is one component, some SVG and eight keyframes.
 */

const INK = "#241a12"
const RUBRIC = "#9d2b1b"
const GOLD = "#b68a2c"
const LAPIS = "#1e2c52"

/** Revelation 12, King James Version (1611) — public domain. */
const APOCALYPSE =
  "And there appeared a great wonder in heaven; a woman clothed with the sun, and the moon under her feet, and upon her head a crown of twelve stars: and she being with child cried, travailing in birth, and pained to be delivered. And there appeared another wonder in heaven; and behold a great red dragon, having seven heads and ten horns, and seven crowns upon his heads. And his tail drew the third part of the stars of heaven, and did cast them to the earth: and the dragon stood before the woman which was ready to be delivered, for to devour her child as soon as it was born. And she brought forth a man child, who was to rule all nations with a rod of iron: and her child was caught up unto God, and to his throne. And the woman fled into the wilderness, where she hath a place prepared of God, that they should feed her there a thousand two hundred and threescore days. And there was war in heaven: Michael and his angels fought against the dragon; and the dragon fought and his angels, and prevailed not; neither was their place found any more in heaven. And the great dragon was cast out, that old serpent, called the Devil, and Satan, which deceiveth the whole world: he was cast out into the earth, and his angels were cast out with him. And when the dragon saw that he was cast unto the earth, he persecuted the woman which brought forth the man child. And to the woman were given two wings of a great eagle, that she might fly into the wilderness, into her place, where she is nourished for a time, and times, and half a time, from the face of the serpent."

const styles = [
  "@keyframes sw-ember { 0% { transform: translate3d(0,0,0) scale(0.6); opacity: 0 }",
  "  12% { opacity: 0.9 } 70% { opacity: 0.55 }",
  "  100% { transform: translate3d(var(--sw-drift), -190px, 0) scale(1.1); opacity: 0 } }",
  ".sw-ember { animation: sw-ember var(--sw-life) linear var(--sw-delay) infinite }",
  "@media (prefers-reduced-motion: reduce) { .sw-ember { animation: none; opacity: 0.4 } }",
].join("\n")

/** Embers off the beast, rising through the column. */
function Embers() {
  const sparks = [
    [14, 6.0, 0.0, 3, 20],
    [23, 7.4, 1.6, 2, -16],
    [31, 5.4, 3.1, 2, 12],
    [39, 6.8, 0.9, 3, 26],
    [46, 8.2, 2.2, 2, -24],
    [54, 5.8, 4.0, 4, 10],
    [59, 7.0, 1.2, 2, 18],
    [66, 6.4, 2.7, 3, -14],
    [72, 8.0, 0.4, 2, 22],
    [79, 5.6, 3.5, 3, -10],
    [86, 7.2, 1.9, 2, 16],
    [93, 6.6, 0.7, 3, -20],
  ] as const

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map(([left, life, delay, size, drift], i) => (
        <span
          key={i}
          className="sw-ember absolute bottom-0 block rounded-full"
          style={{
            left: `${left}%`,
            width: size,
            height: size,
            background: i % 3 === 0 ? RUBRIC : GOLD,
            boxShadow: `0 0 ${size * 2.5}px ${i % 3 === 0 ? RUBRIC : GOLD}`,
            ["--sw-life" as string]: `${life}s`,
            ["--sw-delay" as string]: `${delay}s`,
            ["--sw-drift" as string]: `${drift}px`,
          }}
        />
      ))}
    </div>
  )
}

/** A gold-ground initial on a lapis panel, the way a scribe would set it. */
function Initial() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" className="block">
      <rect width="100" height="100" fill={GOLD} />
      <rect x="3" y="3" width="94" height="94" fill="none" stroke={RUBRIC} strokeWidth="2.5" />
      <rect x="11" y="11" width="78" height="78" fill={LAPIS} />
      {/* corner dots, the cheapest ornament a scriptorium had */}
      <g fill={GOLD}>
        <circle cx="17" cy="17" r="2.4" />
        <circle cx="83" cy="17" r="2.4" />
        <circle cx="17" cy="83" r="2.4" />
        <circle cx="83" cy="83" r="2.4" />
      </g>
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fill="#f4e9cd"
        style={{ font: "700 74px ui-serif, Georgia, 'Times New Roman', serif" }}
      >
        A
      </text>
    </svg>
  )
}

export default function Demo() {
  return (
    <div
      className="min-h-screen w-full px-4 pb-[45svh] pt-10 sm:px-8 sm:pt-16"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #f7efd9 0%, #efe3c4 45%, #e4d5b2 100%)",
      }}
    >
      <style>{styles}</style>

      <article
        className="relative mx-auto w-full max-w-4xl px-7 py-10 sm:px-16 sm:py-16"
        style={{
          color: INK,
          background:
            "radial-gradient(80% 60% at 30% 20%, rgba(255,252,240,0.9), rgba(247,238,215,0.55) 60%, rgba(233,219,188,0.35) 100%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 50px -28px rgba(60,40,20,0.55)",
          border: "1px solid rgba(160,134,92,0.45)",
        }}
      >
        <header
          className="mb-8 flex items-baseline justify-between text-[10px] uppercase tracking-[0.34em]"
          style={{ color: RUBRIC }}
        >
          <span>Liber Bestiarum</span>
          <span style={{ color: "rgba(90,70,45,0.7)" }}>folio xxvii·r</span>
        </header>

        <div className="relative font-serif text-[17px] leading-[1.7] sm:text-[18px]">
          <Embers />
          <SilhouetteWrap
            text={APOCALYPSE}
            silhouette="dragon"
            size={282}
            follow="scroll"
            travel={[0.2, 0.58]}
            drift={26}
            gutter={14}
            minRun={104}
            tolerance={0.9}
            dropCap={4}
            cap={<Initial />}
            rubricLines={2}
            rubricColor={RUBRIC}
          >
            <svg viewBox="0 0 170 150" width="100%" height="100%" className="block">
              {/* the woman clothed with the sun, which the dragon stood before */}
              <g transform="translate(80.1 78.6)">
                <circle r="25" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85" />
                <circle r="13" fill={GOLD} opacity="0.9" />
                <circle r="7" fill={RUBRIC} opacity="0.85" />
                <g stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
                  <path d="M0 -19 V-25 M0 19 V25 M-19 0 H-25 M19 0 H25 M-13.4 -13.4 l-4.2 -4.2 M13.4 13.4 l4.2 4.2 M13.4 -13.4 l4.2 -4.2 M-13.4 13.4 l-4.2 4.2" />
                </g>
              </g>
              <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                {SILHOUETTES.dragon.shapes.map((shape, i) => (
                  <path
                    key={i}
                    d={shape.path}
                    fill={shape.width ? "none" : undefined}
                    strokeWidth={shape.width}
                  />
                ))}
              </g>
              {/* the one eye, struck out of the ink */}
              <circle cx="145" cy="24" r="2.8" fill="#f4ead2" />
            </svg>
          </SilhouetteWrap>
        </div>

        <footer
          className="mt-10 flex items-baseline justify-between border-t pt-3 text-[10px] uppercase tracking-[0.3em]"
          style={{ borderColor: "rgba(160,134,92,0.4)", color: RUBRIC }}
        >
          <span>Apocalypsis xii</span>
          <span style={{ color: "rgba(90,70,45,0.7)" }}>set in the browser, one line at a time</span>
        </footer>
      </article>
    </div>
  )
}
