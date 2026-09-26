"use client"

import * as React from "react"
import PixelSpiderTracker, { searchPlaces, type Place, type Sighting } from "@/components/ui/pixel-spider-tracker"

// Same tracker, re-skinned as a coffee-run tracker: no intro, flat map, a
// custom pin list and an async `onSearch` standing in for a real geocoder.
const CAFES: Sighting[] = [
  { id: "c1", name: "Blue Bottle", country: "San Francisco", lat: 37.78, lon: -122.41, kind: "red", note: "Pour-over, 4.8 stars.", time: "OPEN" },
  { id: "c2", name: "Monmouth", country: "London", lat: 51.51, lon: -0.09, kind: "red", note: "Queue round the block.", time: "OPEN" },
  { id: "c3", name: "Fuglen", country: "Tokyo", lat: 35.67, lon: 139.69, kind: "green", note: "Visited. Get the aeropress.", time: "VISITED" },
  { id: "c4", name: "Third Wave Coffee", country: "Bengaluru", lat: 12.97, lon: 77.6, kind: "green", note: "Visited. Cold brew, strong.", time: "VISITED" },
  { id: "c5", name: "Tim Wendelboe", country: "Oslo", lat: 59.92, lon: 10.76, kind: "white", note: "On the wishlist.", time: "SOMEDAY" },
  { id: "c6", name: "Toby's Estate", country: "Sydney", lat: -33.88, lon: 151.2, kind: "red", note: "Flat white capital.", time: "OPEN" },
  { id: "c7", name: "Cafe Tortoni", country: "Buenos Aires", lat: -34.61, lon: -58.38, kind: "white", note: "Since 1858.", time: "SOMEDAY" },
]

async function lookup(query: string): Promise<Place[]> {
  // Swap this for your geocoder (Mapbox, Google, Nominatim...).
  await new Promise((r) => setTimeout(r, 400))
  return searchPlaces(query).map((p) => ({ ...p, note: "Nearest espresso: unknown. Go explore." }))
}

export default function DemoMap() {
  return (
    <div className="w-full">
      <PixelSpiderTracker
        intro={false}
        defaultView="map"
        title={["COFFEE", "TRACKER"]}
        sightings={CAFES}
        onSearch={lookup}
        placeholder="Where do you need coffee? Try Paris or 40.7, -74"
        colors={{ frame: "#d9803a", frameLight: "#f3b77a", frameDark: "#a2561f", accent: "#4fc3f7", land: "#3e6b52", landDark: "#315842", coast: "#6fa184", ocean: "#1a2b3c", oceanDeep: "#142232", grid: "#223a50", body: "#8b5a2b", belly: "#e8c07a" }}
      />
    </div>
  )
}
