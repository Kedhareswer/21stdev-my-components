import SectorTideMatrix, { type TideBand } from "@/components/ui/sector-tide-matrix"

// #region data
// Placeholder data, not a real record: a seeded, synthetic payroll series. Twenty
// sectors over 110 months slide into a downturn, bottom out and recover, with
// autocorrelated noise on top. Seeded, so it is the same series on every render.

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** [name, base drift %, cycle sensitivity, noise, chance of an exactly flat month] */
const PROFILES: [string, number, number, number, number][] = [
  ["Construction", -0.02, 1.5, 0.34, 0.01],
  ["Durable goods", -0.08, 1.35, 0.28, 0.01],
  ["Nondurable goods", -0.12, 0.7, 0.2, 0.03],
  ["Wholesale trade", 0.04, 0.8, 0.18, 0.03],
  ["Retail trade", 0.04, 0.8, 0.2, 0.02],
  ["Transportation & warehousing", 0.08, 0.9, 0.3, 0.02],
  ["Utilities", 0.0, 0.15, 0.3, 0.07],
  ["Information", -0.06, 0.6, 0.3, 0.03],
  ["Finance & insurance", 0.02, 0.6, 0.18, 0.03],
  ["Real estate & leasing", 0.02, 0.8, 0.28, 0.03],
  ["Professional & technical", 0.18, 0.7, 0.18, 0.01],
  ["Admin & support", 0.12, 1.5, 0.45, 0.01],
  ["Education services", 0.22, 0.05, 0.3, 0.03],
  ["Health care", 0.24, 0.08, 0.1, 0.01],
  ["Social assistance", 0.3, 0.1, 0.35, 0.02],
  ["Arts & recreation", 0.12, 0.5, 0.45, 0.03],
  ["Accommodation", 0.06, 0.6, 0.4, 0.03],
  ["Food services", 0.18, 0.55, 0.18, 0.01],
  ["Mining & logging", 0.25, 0.9, 0.7, 0.02],
  ["Government", 0.03, 0.15, 0.1, 0.05],
]

/** The business cycle, months since the first month: [month, strength]. Interpolated linearly. */
const CYCLE: [number, number][] = [
  [0, 0.7], [18, 0.55], [23, 0.2], [30, -0.55], [36, -1.45], [39, -1.75], [42, -1.3],
  [48, -0.35], [54, 0.35], [62, 0.25], [74, 0.5], [92, 0.55], [109, 0.8],
]

function cycleAt(t: number) {
  if (t <= CYCLE[0][0]) return CYCLE[0][1]
  for (let i = 1; i < CYCLE.length; i++) {
    const [t1, v1] = CYCLE[i]
    if (t <= t1) {
      const [t0, v0] = CYCLE[i - 1]
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
    }
  }
  return CYCLE[CYCLE.length - 1][1]
}

/** months x sectors, % change from the previous month, rounded to 0.01. 0 means unchanged. */
function generateSeries(months = 110, seed = 2006): number[][] {
  const r = mulberry32(seed)
  const eps = PROFILES.map(() => 0)
  const out: number[][] = []
  for (let m = 0; m < months; m++) {
    const c = cycleAt(m)
    const row: number[] = []
    PROFILES.forEach((p, s) => {
      const shock = (r() + r() + r() - 1.5) * p[3]
      eps[s] = eps[s] * 0.45 + shock
      let v = p[1] - 0.07 + p[2] * c * 0.55 + eps[s] * 1.2
      v = Math.round(v * 100) / 100
      if (r() < p[4] * 0.6 || Math.abs(v) < 0.01) v = 0
      row.push(v === 0 ? 0 : v)
    })
    out.push(row)
  }
  return out
}

const SECTORS = PROFILES.map((p) => p[0])
const SERIES = generateSeries()
// #endregion

// Module-level, so the chart's 2,000 dots are not rebuilt when a parent re-renders.
const BANDS: TideBand[] = [{ from: "2007-12", to: "2009-06", label: "Recession", imagine: true }]

export default function SectorTideMatrixDemo() {
  return (
    <SectorTideMatrix
      eyebrow="Payroll tide · 2006 – 2015"
      title="Who’s hiring, who’s cutting"
      description="Each dot is an industry. Sectors that added jobs stack above the line, sectors that shed them sink below it, and the shade shows how far each one’s payrolls moved from the month before."
      legendLabel="Change in payrolls from the previous month"
      footnote="Placeholder data: a seeded, synthetic series shaped like a downturn and a recovery."
      sectors={SECTORS}
      data={SERIES}
      start="2006-01"
      bands={BANDS}
    />
  )
}
