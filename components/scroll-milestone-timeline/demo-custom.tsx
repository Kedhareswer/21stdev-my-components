"use client"

import ScrollMilestoneTimeline, { type TimelineEvent } from "@/components/ui/scroll-milestone-timeline"

// A different life for the same bones: an indie game studio, on ink instead of
// paper, a serif for the dates and `at` in years (halves are fine).
const events: TimelineEvent[] = [
  { at: 2019, date: "2019", title: "Studio founded", color: "#ff6b4a", level: 2, detail: "Three people and a jam entry that would not stay a jam entry." },
  { at: 2019.5, date: "Autumn 2019", title: "Custom 2D lighting\nengine, v0", level: 3 },
  { at: 2020, date: "2020", title: "Kickstarter: 412% funded", color: "#ffc857", level: 4, detail: "8,904 backers in thirty days." },
  { at: 2020.5, date: "Summer 2020", title: "Rollback netcode\nfor co-op", level: 1 },
  { at: 2021, date: "2021", title: "Early access on Steam", color: "#7ce0b8", level: 2 },
  { at: 2021.5, date: "Winter 2021", title: "Save format rewrite\n(no more corrupted runs)", level: 4 },
  { at: 2022.5, date: "Mid 2022", title: "1.0 launch — 250k copies", color: "#9aa8ff", level: 4, detail: "Top 10 on the global sellers chart for its first week." },
  { at: 2023, date: "2023", title: "Console ports\nship day-and-date", level: 2 },
  { at: 2023.5, date: "Late 2023", title: "Next game announced", color: "#f59bd8", level: 2 },
]

export default function DemoCustom() {
  return (
    <div className="w-full">
      <ScrollMilestoneTimeline
        events={events}
        kicker="Lantern Moth Games · 2019 — 2023"
        title="Five years, one very stubborn moth"
        background="#101113"
        ink="#f1ede4"
        fontSans='"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
        scrollPerEvent={0.5}
      />
    </div>
  )
}
