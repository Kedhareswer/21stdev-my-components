"use client"

import MorphFilterBar, { type FilterField } from "@/components/ui/morph-filter-bar"

// Free Unsplash portraits. Swap in your own.
const face = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=64&h=64&fit=crop&crop=faces&q=70"

const fields: FilterField[] = [
  {
    key: "status",
    label: "Status",
    icon: "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5v4.5l3 2",
    options: [
      { value: "backlog", label: "Backlog", swatch: "#a1a1aa" },
      { value: "todo", label: "Todo", swatch: "#e4e4e7" },
      { value: "progress", label: "In progress", swatch: "#f5b83d" },
      { value: "review", label: "In review", swatch: "#7c6cff" },
      { value: "done", label: "Done", swatch: "#3ccf8e" },
    ],
  },
  {
    key: "assignee",
    label: "Assignee",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5",
    options: [
      { value: "maya", label: "Maya Okafor", avatar: face("1531123897727-8f129e1688ce") },
      { value: "theo", label: "Theo Lindqvist", avatar: face("1500648767791-00dcc994a43e") },
      { value: "priya", label: "Priya Raman", avatar: face("1580489944761-15a19d654956") },
      { value: "jonah", label: "Jonah Weiss", avatar: face("1506794778202-cad84cf45f1d") },
      { value: "lena", label: "Lena Ferreira", avatar: face("1534528741775-53994a69daeb") },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    icon: "M6 20V5M6 5h10l-2 3.5 2 3.5H6",
    options: [
      { value: "urgent", label: "Urgent", swatch: "#ff5a4f" },
      { value: "high", label: "High", swatch: "#ff9f43" },
      { value: "medium", label: "Medium", swatch: "#f5d33d" },
      { value: "low", label: "Low", swatch: "#8fb3ff" },
    ],
  },
  {
    key: "label",
    label: "Label",
    icon: "M4 12.5V5h7.5l8.5 8.5-7.5 7.5zM8.5 8.5h.01",
    options: [
      { value: "bug", label: "Bug", swatch: "#ff5a4f" },
      { value: "feature", label: "Feature", swatch: "#7c6cff" },
      { value: "design", label: "Design", swatch: "#f06bd0" },
      { value: "perf", label: "Performance", swatch: "#3ccf8e" },
      { value: "docs", label: "Docs", swatch: "#8fb3ff" },
    ],
  },
  {
    key: "due",
    label: "Due date",
    icon: "M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4",
    options: [
      { value: "overdue", label: "Overdue" },
      { value: "today", label: "Today" },
      { value: "week", label: "This week" },
      { value: "month", label: "This month" },
    ],
  },
]

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        padding: "88px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "radial-gradient(60% 50% at 30% 0%, color-mix(in oklab, #d6ff5c 22%, transparent), transparent 70%), var(--color-background)",
      }}
    >
      <div style={{ width: "min(560px, 100%)" }}>
        <MorphFilterBar
          title="Issues · Spring launch"
          fields={fields}
          defaultValue={[
            { key: "status", value: "progress" },
            { key: "assignee", value: "maya" },
          ]}
        />
      </div>
    </div>
  )
}
