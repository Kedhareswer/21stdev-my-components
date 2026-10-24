"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"

// The ink preset under John Martin's "The Great Day of His Wrath" (1851–53,
// public domain). The wordmark uses a space and an ampersand from the set.
export default function DemoInk() {
  return (
    <div className="w-full">
      <WildHuntFooter
        preset="ink"
        wordmark="EMBER & ASH"
        image={{
          src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/John_Martin_-_The_Great_Day_of_His_Wrath_-_Google_Art_Project.jpg/1280px-John_Martin_-_The_Great_Day_of_His_Wrath_-_Google_Art_Project.jpg",
          alt: "The Great Day of His Wrath — mountains overturning under a red sky, by John Martin, 1851–53",
          position: "50% 30%",
        }}
        imageHeight={0.56}
        dissolve={0.55}
        tagline="A small press for long fiction · set by hand · bound in cloth"
        sideNote="Volume IX · the apocalyptic sublime · twelve plates"
        columns={[
          { title: "Catalogue", links: [{ label: "New titles" }, { label: "Backlist" }, { label: "Subscriptions" }] },
          { title: "Press", links: [{ label: "About" }, { label: "Submissions" }, { label: "Stockists" }] },
          { title: "Elsewhere", links: [{ label: "Instagram" }, { label: "Letterboxd" }] },
          { title: "Contact", links: [{ label: "post@emberandash.press" }] },
        ]}
        colophon="Painting: John Martin, The Great Day of His Wrath, 1851–53. Tate Britain. Public domain, via Wikimedia Commons."
        legal="© 2026 Ember & Ash"
      />
    </div>
  )
}
