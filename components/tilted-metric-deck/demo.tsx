import TiltedMetricDeck from "@/components/ui/tilted-metric-deck"

const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
const rows = (scores: number[]) => months.map((label, i) => ({ label, score: scores[i] }))

const metrics = [
  { label: "Revenue", value: "$184.2K", delta: "+12.4%", trend: [42, 45, 44, 51, 49, 58, 61, 60, 68, 72, 70, 79], rows: rows([48, 52, 55, 61, 66, 70, 79]), target: 83, updated: "Sep 30, 2026" },
  { label: "Active users", value: "9,416", delta: "+8.2%", trend: [30, 34, 33, 38, 41, 39, 45, 47, 46, 52, 55, 58], rows: rows([60, 44, 72, 54, 81, 64, 92]), target: 76, updated: "Sep 30, 2026" },
  { label: "Conversion", value: "3.6%", delta: "−0.4%", trend: [40, 44, 39, 47, 41, 38, 43, 36, 40, 35, 37, 34], rows: rows([56, 61, 46, 66, 44, 57, 52]), target: 48, updated: "Sep 30, 2026" },
  { label: "Avg. order", value: "$86.40", delta: "+3.1%", trend: [50, 52, 51, 49, 53, 55, 54, 57, 56, 58, 60, 61], rows: rows([62, 64, 63, 66, 68, 67, 71]), target: 64, updated: "Sep 30, 2026" },
  { label: "Churn", value: "1.8%", delta: "−0.6%", trend: [60, 58, 59, 55, 53, 54, 50, 48, 47, 45, 44, 41], rows: rows([38, 35, 36, 31, 29, 27, 24]), target: 91, updated: "Sep 30, 2026" },
  { label: "NPS", value: "72", delta: "+4 pts", trend: [55, 57, 56, 60, 61, 63, 62, 66, 67, 69, 70, 72], rows: rows([61, 63, 64, 66, 68, 70, 72]), target: 88, updated: "Sep 30, 2026" },
]

export default function Demo() {
  return (
    <div className="flex min-h-[620px] w-full items-center justify-center bg-background p-4 sm:p-10">
      <TiltedMetricDeck metrics={metrics} />
    </div>
  )
}
