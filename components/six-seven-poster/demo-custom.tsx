"use client"

import SixSevenPoster from "@/components/ui/six-seven-poster"

// Any two glyphs, any title, any grade. A cold teal field and warm paint,
// counting 4 then 2, on a slower clock that plays once and stays.
export default function DemoCustom() {
  return (
    <div className="w-full">
      <SixSevenPoster
        first="4"
        second="2"
        title="THE ANSWER"
        captions={["First, it was four.", "Then, it was two."]}
        cast={["Deep Thought", "A Towel", "The Mice"]}
        credit="A film about the question"
        billing="Magrathea presents · a seven and a half million year production · starring a very large computer · a towel · and two small white mice · music by the vogons (regrettably)"
        release="Coming 4.2"
        rating="Mostly harmless"
        red="#0f5e63"
        paint="#f4efe4"
        ink="#061013"
        duration={13}
        loop={false}
        grain={0.18}
      />
    </div>
  )
}
