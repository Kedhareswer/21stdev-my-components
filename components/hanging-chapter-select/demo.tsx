"use client"

import HangingChapterSelect from "@/components/ui/hanging-chapter-select"

// Your own wall: an English reading list in a sea-glass palette, two sections,
// and a credits strip with your links.
export default function Demo() {
  return (
    <HangingChapterSelect
      title="SUMMER READING"
      script="one page at a time"
      brand="Mira Sol"
      brandSub="Book club · est. 2019"
      site="mirasol.example"
      palette={{ paper: "#eef4f1", ink: "#28403c", pink: "#f08a74", blue: "#3f7f9a", leaf: "#5f9e7a" }}
      credits={[
        { label: "Host", sub: "Book club", value: "Mira Sol" },
        { label: "Mail", sub: "Say hello", value: "mira@example.com", href: "mailto:mira@example.com" },
      ]}
      qrImage={false}
      tabs={[
        {
          label: "Books",
          sub: "Shelf",
          icon: "bloom",
          cards: [
            { title: "Tide", subtitle: "Stories from the coast", tag: "June", tagSub: "Week 1", art: "bouquet", colors: { bg: "#9fd3e0", ink: "#1f4f63", accent: "#f08a74" }, progress: 1, meta: ["212 pages"], description: "Twelve short stories set in one fishing town, one for each month of the tide tables." },
            { title: "Glass", subtitle: "A novel in windows", tag: "June", tagSub: "Week 3", art: "window", colors: { bg: "#f4efe2", ink: "#28403c", accent: "#5f9e7a" }, progress: 0.35, meta: ["340 pages"], description: "A greenhouse keeper writes to every visitor who leaves a fingerprint on the glass." },
            { title: "Ember", subtitle: "Poems for late August", tag: "July", tagSub: "Week 1", art: "silhouette", colors: { bg: "#f08a74", ink: "#1d1a17", accent: "#28403c" }, meta: ["96 pages"], description: "Short poems about the last warm evenings, best read outside." },
            { title: "North", subtitle: "Letters from the ice", tag: "July", tagSub: "Week 3", art: "frost", colors: { bg: "#3f7f9a", ink: "#102a33", accent: "#fbe07a" }, locked: true, lockHint: "Opens on 15 July", meta: ["180 pages"] },
          ],
        },
        {
          label: "Films",
          sub: "Screenings",
          icon: "camera",
          cards: [
            { title: "Reel", subtitle: "Friday screening", tag: "Fri", tagSub: "8 pm", art: "film", colors: { bg: "#28403c", ink: "#f4efe2", accent: "#f08a74" }, meta: ["Rooftop"], description: "Bring a blanket. Popcorn is on the house, opinions are on you.", href: "#films" },
            { title: "Notes", subtitle: "What we thought", tag: "Sat", tagSub: "Recap", art: "notes", colors: { bg: "#fbf7ef", ink: "#28403c", accent: "#f08a74" }, meta: ["5 min read"], description: "Everyone's one-line review of last week's film, unedited." },
          ],
        },
      ]}
    />
  )
}
