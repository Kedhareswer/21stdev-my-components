import LedMatrixSales from "@/components/ui/led-matrix-sales"

// Six weeks of a small shop's daily takings: soft Mondays, strong weekends,
// and a launch spike in week four.
const start = Date.UTC(2026, 8, 14)
const data = Array.from({ length: 42 }, (_, i) => {
  const day = new Date(start + i * 864e5)
  const dow = day.getUTCDay()
  const weekend = dow === 0 || dow === 6 ? 1.45 : dow === 1 ? 0.7 : 1
  const trend = 1 + i * 0.012
  const wobble = 0.85 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.3
  const launch = i >= 22 && i <= 25 ? 1.9 - (i - 22) * 0.22 : 1
  return {
    label: day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    value: Math.round(4200 * weekend * trend * wobble * launch),
  }
})

export default function Demo() {
  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-background p-4 sm:p-10">
      <LedMatrixSales data={data} title="Net sales" caption="Daily revenue · Sep 14 – Oct 25" delta={12.4} deltaLabel="vs previous 6 weeks" />
    </div>
  )
}
