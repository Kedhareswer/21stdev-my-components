"use client"

import AquaStoryProfileTemplate from "@/components/ui/aqua-story-profile-template"

const img = (id: string, w: number, h: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&h=" + h + "&q=80"
const face = (id: string) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&crop=faces&w=200&h=200&q=80"

export default function DemoCustom() {
  return (
    <AquaStoryProfileTemplate
      palette="blush"
      tint={0.28}
      likes={1280}
      profile={{
        name: "Mali Chaiyaporn",
        handle: "mali.inbloom",
        avatar: face("1544005313-94ddf0286df2"),
        tagline: "tap the flower if we're friends",
        bio: "flowers, film and long train rides. trading reviews with anyone who says hi.",
        url: "https://instagram.com/mali.inbloom",
      }}
      stories={[
        { image: img("1544005313-94ddf0286df2", 1200, 1100), caption: "first rainy day of the season and i'm weirdly happy about it", date: "03 June 2026", location: "Ari, Bangkok" },
        { image: img("1490750967868-88aa4486c946", 1200, 1100), caption: "bought far too many flowers again, no regrets", date: "09 June 2026", location: "Pak Khlong Talat" },
        { image: img("1494790108377-be9c29b29330", 1200, 1100), caption: "this week: say the nice thing out loud, then write it down", date: "16 June 2026", location: "Chiang Mai" },
      ]}
      note={{ placeholder: "ฝากข้อความหน่อยนะ…", sent: "ส่งแล้ว ♡ message sent" }}
      ribbon={{ credit: "mali.c", credit2: "bangkok diary" }}
      exchange={{
        title: "Trade a review",
        image: img("1490750967868-88aa4486c946", 1400, 640),
        text: "leave me one and i'll write yours back by sunday",
        tab: "reviews open",
        link: { label: "@ mali.inbloom", url: "https://instagram.com/mali.inbloom", avatar: face("1544005313-94ddf0286df2") },
        sticker: "@ mali.inbloom",
        footCenter: "flower diaries in highlights",
        footRight: "replies every sunday",
      }}
      highlights={{
        items: [
          { label: "blooms", cover: img("1490750967868-88aa4486c946", 300, 300), slides: [img("1490750967868-88aa4486c946", 900, 1600)] },
          { label: "coffee", cover: img("1509042239860-f550ce710b93", 300, 300), slides: [img("1509042239860-f550ce710b93", 900, 1600), img("1495474472287-4d71bcdd2085", 900, 1600)] },
          { label: "islands", cover: img("1507525428034-b723cf961d3e", 300, 300), slides: [img("1507525428034-b723cf961d3e", 900, 1600)] },
        ],
      }}
      quiz={{
        button: "quiz me !",
        questions: [
          { q: "my flower market order?", options: ["white jasmine", "pink peonies", "a single sunflower", "whatever's cheapest"], answer: 1 },
          { q: "window or aisle?", options: ["window, always", "aisle", "the floor, honestly"], answer: 0 },
          { q: "late-night snack?", options: ["mango sticky rice", "instant noodles", "toast with condensed milk"], answer: 2 },
        ],
      }}
      persistDecorations={false}
    />
  )
}
