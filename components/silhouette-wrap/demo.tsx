"use client"

import SilhouetteWrap from "@/components/ui/silhouette-wrap"

/**
 * The fall. Scroll and the keyhole drops through the column while the passage
 * re-typesets around its outline — wide at the bow, pinched at the waist,
 * flaring again at the base. Through the hole: the loveliest garden you ever
 * saw, which is the one thing Alice cannot reach.
 */
export default function Demo() {
  return (
    <div className="w-full bg-background text-foreground">
      <section className="flex h-[62svh] flex-col items-center justify-end px-6 pb-16 text-center">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.42em] text-muted-foreground">
          Chapter I
        </p>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
          Down the Rabbit-Hole
        </h1>
        <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          scroll — the text gets out of the way
        </p>
      </section>

      <div className="mx-auto w-full max-w-2xl px-6 font-serif text-[19px] leading-[1.85]">
        <SilhouetteWrap size={210}>
          <svg viewBox="0 0 100 158" width="100%" height="100%" className="block">
            <defs>
              <clipPath id="sw-keyhole">
                <path d="M50 12 A34 34 0 1 0 50.01 12 Z M40 70 L29 146 Q50 157 71 146 L60 70 Z" />
              </clipPath>
              <radialGradient id="sw-garden" cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#fdf6c8" />
                <stop offset="38%" stopColor="#9fd08a" />
                <stop offset="72%" stopColor="#3f7d4b" />
                <stop offset="100%" stopColor="#14361f" />
              </radialGradient>
            </defs>
            <g clipPath="url(#sw-keyhole)">
              <rect x="0" y="0" width="100" height="158" fill="url(#sw-garden)" />
              {/* a hedge, a path, and the door you are too large to fit through */}
              <path d="M0 96 Q26 80 50 96 Q74 112 100 96 L100 158 L0 158 Z" fill="#2f6b3d" opacity="0.9" />
              <path d="M44 158 L50 104 L56 158 Z" fill="#e8dfa8" opacity="0.75" />
              <circle cx="50" cy="40" r="7" fill="#fffbe6" opacity="0.85" />
            </g>
            <path
              d="M50 12 A34 34 0 1 0 50.01 12 Z M40 70 L29 146 Q50 157 71 146 L60 70 Z"
              fill="none"
              className="stroke-foreground"
              strokeWidth={2.5}
            />
          </svg>
        </SilhouetteWrap>
      </div>

      <section className="mx-auto w-full max-w-2xl px-6 pb-[95svh] pt-14">
        <hr className="border-border" />
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Lewis Carroll, 1865 · public domain
        </p>
      </section>
    </div>
  )
}
