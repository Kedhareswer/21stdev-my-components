"use client"

import AltoCoffeeTemplate from "@/components/ui/alto-coffee-template"

// The same template re-dressed for another roaster and harvest: the "huila"
// preset (a snow-capped Andean volcano at dawn, tangerine accent), a new brand,
// a different route on the map and a different line-up.
export default function DemoHuila() {
  return (
    <div className="w-full">
      <AltoCoffeeTemplate
        preset="huila"
        brand={{ name: "Cumbre" }}
        hero={{
          title: ["Colombia", "Huila"],
          peak: { name: "Nevado del Huila", altitude: 5364 },
          farmAltitude: 1780,
          coords: "2.93° N · 76.03° W",
          soil: "Coffee grown under a glacier, on Andean ash",
          caption: "Smallholdings on the Magdalena's upper slopes, where meltwater runs cold and the cherries take nine months to ripen.",
        }}
        crop={{
          year: "2027",
          title: "First Harvest",
          body: "Our first lots from Huila: picked April to June by forty families in San Agustín, dried on raised beds and roasted the week they land.",
          stats: [
            { value: "1,780 m", label: "Grown at" },
            { value: "Pink Bourbon", label: "Varietal" },
            { value: "88.0", label: "Cupping score" },
          ],
        }}
        origins={{
          kicker: "Three harvests on the route",
          title: "Followed to the source.",
          steps: [
            { year: "2025", country: "kenya", region: "Nyeri, Mount Kenya", altitude: "1,850 m", process: "Double washed", notes: ["Blackcurrant", "Tomato", "Grapefruit"], blurb: "SL28 and SL34 from cooperatives on the mountain's southern slope." },
            { year: "2026", country: "rwanda", region: "Nyamasheke, Lake Kivu", altitude: "1,900 m", process: "Washed", notes: ["Red apple", "Black tea", "Honey"], blurb: "Washing stations on the shore of Lake Kivu, sorted twice by hand." },
            { year: "2027", country: "colombia", region: "Huila, San Agustín", altitude: "1,780 m", process: "Raised-bed natural", notes: ["Watermelon", "Panela", "Hibiscus"], blurb: "Pink Bourbon from forty families, dried whole for twenty-four days." },
          ],
        }}
        bean={{
          lead: "Pink Bourbon, roasted light to keep the fruit",
          bags: [
            { name: "Huila", sub: "Whole bean", weight: "250 g", kind: "bag" },
            { name: "Huila", sub: "Drip bag × 10", weight: "10 × 10 g", kind: "box" },
          ],
          cards: [
            { label: "Whole bean", name: "Pink Bourbon 250 g", body: "Light roast, rested a week to open the fruit.", color: "#7A3B22", art: "bag", ink: "#F7EFE2" },
            { label: "Note 01", name: "Watermelon", body: "Juicy, sweet and bright on the first sip.", color: "#F08A7E", pattern: "dots" },
            { label: "Note 02", name: "Panela", body: "Unrefined cane sugar holds the whole cup together.", color: "#E9A63C", pattern: "wave" },
            { label: "Note 03", name: "Hibiscus", body: "A floral, tart finish as it cools.", color: "#D45B70", pattern: "diamond", ink: "#2A0E12" },
            { label: "The harvest", name: "Pink Bourbon", body: "A pink-ripening variety, picked over nine months of slow ripening.", color: "#2A1210", art: "cherries", ink: "#F7EFE2" },
          ],
        }}
        limited={{
          lot: "Lot 27-H · Vereda La Primavera",
          total: 1200,
          left: 742,
          currency: "€",
          products: [
            {
              id: "huila-250",
              name: "Pink Bourbon Whole Bean",
              kind: "bag",
              price: 24,
              specs: [["Origin", "Huila, Colombia"], ["Varietal", "Pink Bourbon"], ["Process", "Raised-bed natural"], ["Roast", "Light"], ["Weight", "250 g"]],
            },
            {
              id: "huila-sticks",
              name: "Huila Stick",
              kind: "sticks",
              color: "#2D6E6A",
              price: 18,
              specs: [["Origin", "Huila, Colombia"], ["Format", "20 sticks × 1.2 g"], ["Brew", "120 ml, 88 °C"], ["Roast", "Light"], ["Weight", "24 g"]],
            },
          ],
        }}
        footer={{ line: "From under the glacier to your cup." }}
      />
    </div>
  )
}
