"use client"

import RepairBayConceptTemplate, { RB_HOTSPOTS } from "@/components/ui/repair-bay-concept-template"

// The same scene re-skinned through props only: a teal poster, new copy, and the
// window moods reordered so the tank opens in "Abyss".
export default function DemoAbyss() {
  return (
    <div className="w-full">
      <RepairBayConceptTemplate
        issue="No.12"
        kicker="Night shift"
        title="Overtime"
        date="11 / 14"
        bubble="TSSSK…"
        note="</ the radio is fixed. now the jellyfish are humming back />"
        signature="Ines"
        problem={{ top: "DEEP", bottom: "WATER", tag: "pressure rising" }}
        accent="#1fb5aa"
        accents={["#e9b518", "#ff5a6e"]}
        hotspots={RB_HOTSPOTS.slice(0, 4)}
        moods={[
          { name: "Abyss", tint: "#1fc8c0" },
          { name: "Amber", tint: null },
          { name: "Ultra", tint: "#7f62ff" },
        ]}
        credits={[
          { role: "Concept", name: "Ines Varga" },
          { role: "Shading", name: "North Pier Studio" },
          { role: "Tools", name: "Houdini · Redshift" },
        ]}
      />
    </div>
  )
}
