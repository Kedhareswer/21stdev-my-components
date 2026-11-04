"use client"

import ActivityDeckDropdown, { type Activity } from "@/components/ui/activity-deck-dropdown"

// Free Unsplash photos. Swap in your own.
const pic = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=120&h=120&fit=crop&crop=faces&q=70"

const activities: Activity[] = [
  { id: "a", title: "Maya left a comment", body: "“Love the river shot — can we crop it tighter?”", time: "now", image: pic("1531123897727-8f129e1688ce"), unread: true },
  { id: "b", title: "Theo invited you to Studio", body: "3 boards, 41 files shared with you", time: "4m", image: pic("1500648767791-00dcc994a43e"), unread: true },
  { id: "c", title: "New booking: Ribeira loft", body: "Fri 14 – Sun 16 · 2 guests · €486", time: "22m", image: pic("1555881400-74d7acaacd8b"), unread: true },
  { id: "d", title: "Priya approved the draft", body: "Porto field notes is ready to publish", time: "1h", image: pic("1580489944761-15a19d654956"), unread: true },
  { id: "e", title: "Payout sent", body: "€1,240.00 is on its way to •••• 4182", time: "3h", tint: "linear-gradient(160deg,#25c99b,#11785d)", unread: true },
  { id: "f", title: "Weekly digest", body: "Your work was viewed 2,318 times", time: "Mon", tint: "linear-gradient(160deg,#7a6cff,#3d2fb8)" },
]

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px 16px",
        background: "radial-gradient(70% 55% at 50% 0%, color-mix(in oklab, #5ef0c6 14%, transparent), transparent 70%), var(--color-background)",
      }}
    >
      <ActivityDeckDropdown activities={activities} />
    </div>
  )
}
