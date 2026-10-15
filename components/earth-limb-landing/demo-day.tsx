"use client"

import EarthLimbLanding from "@/components/ui/earth-limb-landing"

// The same page for a maritime imaging company: the day view over a sunlit ocean,
// a coral accent, light pages, port cities and its own copy.
export default function DemoDay() {
  return (
    <EarthLimbLanding
      brand="Tern"
      tagline="Ocean imaging"
      preset="day"
      accent="#ff7a5c"
      theme="light"
      kicker="Maritime imaging"
      headline="Every ship and every coastline, every morning."
      lede="Twelve optical satellites cross the shipping lanes between 10:00 and 11:00 local time. Port calls, anchorage queues and spills, mapped before lunch."
      cta={{ label: "Book a demo", href: "#tasking" }}
      secondaryCta={{ label: "See port coverage", href: "#archive" }}
      imagesPerDay={6200}
      archiveStat={{ value: "41,800", sub: "Port scenes in the archive" }}
      statement="Ships keep schedules and so do we. The same harbour at the same hour, every day, means a missing hull or a new slick stands out at a glance."
      card={{
        kicker: "Spill response",
        title: "Oil on the water",
        body: "When a slick is reported we task the next two passes at no cost and share the outlines with the coast guard.",
        link: { label: "How spill tasking works" },
        kind: "harbor",
      }}
      cities={[
        { name: "Rotterdam", lat: 51.92, lon: 4.48, tz: "Europe/Amsterdam" },
        { name: "Singapore", lat: 1.26, lon: 103.84, tz: "Asia/Singapore" },
        { name: "Los Angeles", lat: 33.74, lon: -118.27, tz: "America/Los_Angeles" },
        { name: "Santos", lat: -23.96, lon: -46.3, tz: "America/Sao_Paulo" },
        { name: "Durban", lat: -29.87, lon: 31.03, tz: "Africa/Johannesburg" },
        { name: "Busan", lat: 35.1, lon: 129.04, tz: "Asia/Seoul" },
      ]}
      uses={[
        {
          id: "ports",
          label: "Ports",
          line: "Berth occupancy for 900 container terminals",
          title: "See which berths are full before the line-up says so.",
          body: "Every terminal, every morning. Hulls are measured, matched to AIS and counted against the published schedule.",
          facts: [
            { label: "Terminals", value: "900+" },
            { label: "Revisit", value: "Daily" },
            { label: "Smallest hull", value: "12 m" },
          ],
          kind: "harbor",
          mode: "radar",
          before: "Optical",
          after: "Radar",
          place: "Container port anchorage",
          date: "14 Oct, 10:22 local",
          cta: { label: "Port coverage", href: "#archive" },
        },
        {
          id: "coast",
          label: "Coastlines",
          line: "Shoreline change after every storm",
          title: "Measure the beach the morning after.",
          body: "Before and after pictures of every coastal asset you insure, with the waterline traced for you.",
          facts: [
            { label: "Resolution", value: "30 cm" },
            { label: "Delivery", value: "Under 3 hours" },
            { label: "Export", value: "GeoJSON" },
          ],
          kind: "site",
          mode: "change",
          before: "June",
          after: "October",
          place: "Port logistics park",
          date: "02 Jun and 06 Oct",
        },
        {
          id: "salt",
          label: "Industry",
          line: "Salt, dredging and land reclamation",
          title: "Watch the work that happens at the waterline.",
          body: "Dredging plumes, new quays and evaporation ponds, tracked month by month for operators and their lenders.",
          facts: [
            { label: "Cadence", value: "Monthly" },
            { label: "Bands", value: "8" },
            { label: "Archive", value: "Since 2021" },
          ],
          kind: "flood",
          mode: "radar",
          before: "Optical",
          after: "Radar",
          place: "River mouth",
          date: "09 Oct, 10:40 local",
        },
      ]}
      archive={[
        { category: "Ports", title: "Anchorage queue before the strike was called off", date: "13 Oct 2026", kind: "harbor" },
        { category: "Industry", title: "Salt ponds at the end of the dry season", date: "07 Oct 2026", kind: "ponds" },
        { category: "Coastlines", title: "Dunes moving toward the coast road", date: "30 Sep 2026", kind: "dunes" },
        { category: "Agriculture", title: "Irrigated fields behind the export terminal", date: "22 Sep 2026", kind: "fields" },
      ]}
      seed={23}
    />
  )
}
