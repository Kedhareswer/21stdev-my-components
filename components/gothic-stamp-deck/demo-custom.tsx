"use client"

import GothicStampDeck from "@/components/ui/gothic-stamp-deck"

// Six stamps, your own words, a different ink. Every colour in the deck —
// paper, glow, silhouettes, foil — is mixed from these five.
export default function Demo() {
  return (
    <div className="w-full">
      <GothicStampDeck
        title="Nocturne"
        script="for you"
        epigraph={"Six small doors.\nPick one and turn it over."}
        palette={{ ink: "#02060f", deep: "#0a1c3d", paper: "#173a78", bright: "#4d8dff", gold: "#e4dcc4" }}
        cards={[
          { title: "The Flight", scene: "murder", verse: "Everything that left\nstill knows the way home.", note: "First door" },
          { title: "The Vow", scene: "oath", verse: "Said once, meant always.", note: "Second door" },
          { title: "The Hour", scene: "hour", verse: "Midnight is only\nthe clock admitting it.", note: "Third door" },
          { title: "The Keeper", scene: "wyrm", verse: "Some things are guarded\nbecause they are loved.", note: "Fourth door" },
          { title: "The Table", scene: "banquet", verse: "Sit. There is always\na glass poured for you.", note: "Fifth door" },
          { title: "The Move", scene: "gambit", verse: "Your turn.", note: "Sixth door" },
        ]}
      />
    </div>
  )
}
