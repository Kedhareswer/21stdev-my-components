"use client"

import { useState } from "react"
import MorphFilterBar, { type AppliedFilter, type FilterField } from "@/components/ui/morph-filter-bar"

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

const issues = [
  { id: "SPR-214", title: "Hero video stutters on first load", status: "progress", assignee: "maya", priority: "urgent", label: "perf", due: "today" },
  { id: "SPR-209", title: "Pricing toggle loses state on back", status: "progress", assignee: "maya", priority: "high", label: "bug", due: "week" },
  { id: "SPR-201", title: "New onboarding illustrations", status: "review", assignee: "priya", priority: "medium", label: "design", due: "week" },
  { id: "SPR-198", title: "Checkout copy pass", status: "todo", assignee: "lena", priority: "low", label: "docs", due: "month" },
  { id: "SPR-190", title: "Image CDN cache headers", status: "progress", assignee: "theo", priority: "high", label: "perf", due: "overdue" },
  { id: "SPR-187", title: "Dark mode for the docs site", status: "backlog", assignee: "jonah", priority: "medium", label: "feature", due: "month" },
  { id: "SPR-183", title: "Launch email template", status: "done", assignee: "maya", priority: "medium", label: "design", due: "today" },
]

const opt = (key: string, value: string) => fields.find((f) => f.key === key)?.options.find((o) => o.value === value)

export default function Demo() {
  const [applied, setApplied] = useState([
    { key: "status", value: "progress" },
  ] as AppliedFilter[])
  const [picking, setPicking] = useState(false)
  const shown = issues.filter((it) => applied.every((f) => (it as Record<string, string>)[f.key] === f.value))

  return (
    <div
      style={{
        minHeight: "100svh",
        padding: "48px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ width: "min(780px, 100%)" }}>
        <MorphFilterBar title="Issues · Spring launch" fields={fields} defaultValue={applied} onChange={setApplied} onOpenChange={setPicking} />
        <ul
          style={{
            listStyle: "none",
            margin: "26px 0 0",
            padding: 0,
            borderTop: "1px solid var(--color-border)",
            minHeight: 340,
            opacity: picking ? 0.28 : 1,
            filter: picking ? "blur(1.5px)" : "none",
            transition: "opacity .35s ease, filter .35s ease",
          }}
        >
          {shown.map((it) => {
            const st = opt("status", it.status)
            const who = opt("assignee", it.assignee)
            const pr = opt("priority", it.priority)
            return (
              <li key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 4px", borderBottom: "1px solid var(--color-border)", fontSize: 16 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, flex: "none", background: st?.swatch }} title={st?.label} />
                <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontVariantNumeric: "tabular-nums", width: 62, flex: "none" }}>{it.id}</span>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 520 }}>{it.title}</span>
                <span style={{ width: 8, height: 8, borderRadius: 2, flex: "none", background: pr?.swatch }} title={pr?.label} />
                {who?.avatar && <img src={who.avatar} alt={who.label} width={22} height={22} style={{ borderRadius: 99, objectFit: "cover", maxWidth: "none", flex: "none" }} />}
              </li>
            )
          })}
          {!shown.length && <li style={{ padding: "22px 4px", fontSize: 14, color: "var(--color-muted-foreground)" }}>No issues match these filters.</li>}
        </ul>
      </div>
    </div>
  )
}
