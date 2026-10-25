"use client"

import VernissageMuseumTemplate from "@/components/ui/vernissage-museum-template"

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

// A second house on the same template: lapis ink instead of gilt, a smaller
// gallery of northern painting with its own hours, prices, rooms and hang,
// and a photograph re-drawn at runtime as the welcome study.
export default function DemoLapis() {
  return (
    <div className="w-full">
      <VernissageMuseumTemplate
        preset="lapis"
        museum={{
          name: "halvard",
          tagline: "Gallery of Northern Painting",
          address: "11 Kanalgata, Bergen 5003",
          phone: "+47 55 01 23 45",
          email: "post@halvard.no",
        }}
        hours={[[11, 16], null, null, [11, 17], [11, 20], [11, 17], [11, 17]]}
        hero={{
          autoplay: 6000,
          slides: [
            {
              kicker: "Through January 18, 2027",
              title: "Fjord and Fell: The Romantic North",
              cta: { label: "See the exhibition", href: "#exhibitions" },
              image: { src: U("1735605918310-73ad27a5dd6b", 2400), focus: [0.5, 0.5], alt: "A skylit gallery hung floor to ceiling with gilt-framed paintings" },
            },
            {
              kicker: "New acquisition",
              title: "Eckersberg's Romsdalen Comes Home",
              cta: { label: "Read the story", href: "#collection" },
              image: { src: U("1761563071832-e548e022a706", 2400), focus: [0.5, 0.55], alt: "A visitor in a skylit blue gallery with a bench" },
            },
          ],
        }}
        welcome={{
          title: "A small gallery for the painters of the North",
          body: "Four hundred paintings, most of them landscapes, most of them painted within a day's sail of this harbour. We show forty at a time and change them with the seasons.",
          image: { src: U("1714393674893-b89e436cc6c4", 1400), focus: [0.5, 0.35], alt: "A marble bust of Marcus Aurelius beside a tall window" },
          sketch: true,
        }}
        exhibitions={{
          items: [
            {
              title: "Fjord and Fell: The Romantic North",
              dates: "October 2, 2026 — January 18, 2027",
              blurb: "Dahl, Fearnley and Eckersberg: the generation that painted Norway into being, with the oil sketches they made on the walk up.",
              image: { src: U("1700405495181-69f35790a8aa", 2000), alt: "Landscape from Romsdalen by Johan Fredrik Eckersberg" },
            },
            {
              title: "Winter Light: Snow in Painting 1850–1930",
              dates: "December 4, 2026 — March 1, 2027",
              blurb: "Blue shadows, pink dusk, grey thaw. Thirty winter pictures and the colour notes the painters kept to get the white right.",
              image: { src: U("1700404245264-10ec1c3a6905", 2000), alt: "Winter Landscape by Arnold Peter Weisz-Kubínčan" },
            },
          ],
        }}
        visitor={{
          prices: [
            { label: "Adults", value: "NOK 140" },
            { label: "Students", value: "NOK 90" },
            { label: "Under 26 on Thursdays", value: "Free" },
          ],
          image: { src: U("1767243304026-219d0acb7c6b", 1800), alt: "A dark red wall hung with rows of framed landscapes" },
        }}
        collection={{
          title: "On the walls",
          intro: "The landscapes in the east galleries this winter.",
          pageSize: 3,
          items: [
            { title: "Landscape from Romsdalen", artist: "Johan Fredrik Eckersberg", year: "1858", ratio: [400, 294], image: U("1700405495181-69f35790a8aa", 1200) },
            { title: "Gebirgssee", artist: "Adolf Zdrazila", year: "1900", ratio: [400, 339], image: U("1699569848351-f28e87e185ec", 1200) },
            { title: "Landscape at Sunset", artist: "Dutch School", year: "1654 – 1657", ratio: [400, 292], image: U("1700404837914-4ccd331c508a", 1200) },
            { title: "Winter Landscape", artist: "Arnold Peter Weisz-Kubínčan", year: "c. 1930", ratio: [400, 291], image: U("1700404245264-10ec1c3a6905", 1200) },
            { title: "Olive Trees", artist: "Vincent van Gogh", year: "1889", ratio: [420, 332], image: U("1782849324101-3ae636a0e270", 1200) },
            { title: "Fischerhaus bei Lübbenau", artist: "Bertha Violet de Chevalier", year: "1882", ratio: [420, 271], image: U("1745761500009-0c62402a06b0", 1200) },
          ],
        }}
      />
    </div>
  )
}
