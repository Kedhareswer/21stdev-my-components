"use client"

import AquaStoryProfileTemplate from "@/components/ui/aqua-story-profile-template"

const img = (id: string, w: number, h: number, crop = "faces") =>
  "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&crop=" + crop + "&w=" + w + "&h=" + h + "&q=80"
const square = (id: string) => img(id, 360, 360, "entropy")
const tall = (id: string) => img(id, 900, 1600, "entropy")

export default function DemoCustom() {
  return (
    <AquaStoryProfileTemplate
      palette="blush"
      tint={0.16}
      likes={1280}
      profile={{
        name: "Sara Rahimi",
        handle: "sara.overcast",
        avatar: img("1722020675125-859ec71b3a54", 200, 200),
        tagline: "tap the flower if we're friends",
        bio: "grey skies, white shirts, long drives to the lake. trading reviews with anyone who says hi.",
        url: "https://instagram.com/sara.overcast",
      }}
      stories={[
        { image: img("1722020675077-ffbb4b9db5bd", 1400, 1280), alt: "Sara by the lake, hand at her collar", caption: "drove two hours for this lake and it was worth every minute", date: "03 June 2026", location: "North shore" },
        { image: img("1722020675125-859ec71b3a54", 1400, 1280), alt: "Sara laughing under an overcast sky", caption: "overcast days are my favourite kind of sunny", date: "09 June 2026", location: "The ridge" },
        { image: img("1722020676175-764304decf39", 1400, 1280), alt: "Sara looking down, smiling", caption: "this week: say the nice thing out loud, then write it down", date: "16 June 2026", location: "Lake house" },
      ]}
      note={{ placeholder: "leave me something cute…", sent: "sent ♡ she'll see it soon" }}
      ribbon={{ credit: "sara.r", credit2: "lake diary" }}
      exchange={{
        title: "Trade a review",
        image: img("1713792491753-baa98227c232", 1600, 760),
        text: "leave me one and i'll write yours back by sunday",
        tab: "reviews open",
        link: { label: "@ sara.overcast", url: "https://instagram.com/sara.overcast", avatar: img("1722020676639-2eca25e91591", 200, 200) },
        sticker: "@ sara.overcast",
        footCenter: "lake diaries in highlights",
        footRight: "replies every sunday",
      }}
      highlights={{
        items: [
          { label: "blooms", cover: square("1596985122625-faf96c53e0c6"), slides: [tall("1596985122625-faf96c53e0c6"), tall("1774228871876-b4d02659fc1c")] },
          { label: "coffee", cover: square("1764298490445-6add12301888"), slides: [tall("1764298490445-6add12301888"), tall("1767840272154-4eb32b348cdd")] },
          { label: "shore", cover: square("1649767647039-c0e46a1012e3"), slides: [tall("1649767647039-c0e46a1012e3"), tall("1562841358-e22c0dcb9b95")] },
        ],
      }}
      quiz={{
        button: "quiz me !",
        questions: [
          { q: "my road trip snack?", options: ["sunflower seeds", "gas station coffee", "dried apricots"], answer: 2 },
          { q: "window or aisle?", options: ["window, always", "aisle", "i'm driving"], answer: 2 },
          { q: "best weather?", options: ["full sun", "overcast", "first snow"], answer: 1 },
        ],
      }}
      persistDecorations={false}
    />
  )
}
