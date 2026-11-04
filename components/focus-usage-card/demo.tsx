"use client"

import FocusUsageCard from "@/components/ui/focus-usage-card"

// Minutes per hour, split into deep work, meetings and messages.
const day = [
  [0, 0, 4], [0, 0, 6], [12, 0, 8], [38, 0, 10], [46, 0, 6], [22, 30, 6],
  [8, 45, 4], [0, 20, 22], [30, 0, 12], [50, 0, 6], [44, 0, 10], [18, 25, 8],
  [10, 40, 6], [26, 0, 14], [12, 0, 18], [0, 0, 24], [0, 0, 16], [0, 0, 6],
]
const hours = ["7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "0"]

export default function Demo() {
  return (
    <FocusUsageCard
      title="Focus report"
      categories={[
        { name: "Deep work", color: "#3d5afe" },
        { name: "Meetings", color: "#ff6b4a" },
        { name: "Messages", color: "#ffbe2e" },
      ]}
      views={[
        {
          id: "day",
          label: "Day",
          caption: "Tuesday, 4 November",
          delta: -18,
          bars: day.map((values, i) => ({ label: hours[i] + ":00", values })),
          axis: ["7 AM", "12 PM", "5 PM", "12 AM"],
        },
        {
          id: "week",
          label: "Week",
          caption: "3 – 9 November",
          delta: 6,
          bars: [
            { label: "Monday", values: [260, 120, 70] },
            { label: "Tuesday", values: [276, 160, 112] },
            { label: "Wednesday", values: [310, 90, 64] },
            { label: "Thursday", values: [190, 220, 96] },
            { label: "Friday", values: [150, 140, 120] },
            { label: "Saturday", values: [40, 0, 80] },
            { label: "Sunday", values: [0, 0, 46] },
          ],
          axis: ["M", "T", "W", "T", "F", "S", "S"],
        },
      ]}
    />
  )
}
