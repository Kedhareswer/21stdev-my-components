"use client"

import OpenSlotBooking from "@/components/ui/open-slot-booking"

// Sample data: on a real page these come from the visitor's connected calendar.
const myWeek = [
  { weekday: 1, from: "11:00", to: "12:00", title: "Standup + review" },
  { weekday: 2, from: "09:00", to: "10:00", title: "Gym" },
  { weekday: 3, from: "10:00", to: "11:30", title: "Design crit" },
  { weekday: 4, from: "14:00", to: "15:00", title: "1:1 with Sam" },
  { weekday: 5, from: "10:30", to: "12:00", title: "Sprint demo" },
]

export default function Demo() {
  return (
    <div className="w-full">
      <OpenSlotBooking visitorEvents={myWeek} />
    </div>
  )
}
