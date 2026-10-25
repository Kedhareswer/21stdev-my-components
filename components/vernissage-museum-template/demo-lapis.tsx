"use client"

import VernissageMuseumTemplate from "@/components/ui/vernissage-museum-template"

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

// A second house on the same template: lapis ink instead of gilt, a smaller
// gallery of northern painting, its own hours, prices, slides and hang.
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
              kicker: "Through January 18",
              title: "Fjord and Fell: The Romantic North",
              cta: { label: "See the exhibition", href: "#exhibitions" },
              image: { src: U("1769117695165-6ecb44ff1150", 2200), focus: [0.5, 0.55], alt: "A long, warm gallery corridor hung with small framed works" },
            },
            {
              kicker: "New acquisition",
              title: "Eckersberg's Romsdalen Comes Home",
              cta: { label: "Read the story", href: "#collection" },
              image: { src: U("1681490443016-30ae75a1647b", 2200), focus: [0.55, 0.5], alt: "A visitor in a white gallery with three framed landscapes" },
            },
          ],
        }}
        welcome={{
          title: "A small gallery for the painters of the North",
          body: "Four hundred paintings, most of them landscapes, most of them painted within a day's sail of this harbour. We show forty at a time and change them with the seasons.",
          image: { src: U("1714393674893-b89e436cc6c4", 1400), focus: [0.5, 0.35], alt: "A marble bust of Marcus Aurelius beside a tall window" },
        }}
        visitor={{
          prices: [
            { label: "Adults", value: "NOK 140" },
            { label: "Students", value: "NOK 90" },
            { label: "Under 26 on Thursdays", value: "Free" },
          ],
          image: { src: U("1736023164636-c41930fb9e10", 1600), alt: "Visitors reading a wall text beside a gold-framed landscape" },
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
            { title: "Tronie of an Old Man", artist: "Rembrandt van Rijn", year: "c. 1630", ratio: [400, 489], image: U("1579009120139-f41119c5e2ba", 1200) },
            { title: "Still Life with Flowers", artist: "Dutch School", ratio: [400, 472], image: U("1588260692965-2c90db1b8c0e", 1200) },
          ],
        }}
      />
    </div>
  )
}
