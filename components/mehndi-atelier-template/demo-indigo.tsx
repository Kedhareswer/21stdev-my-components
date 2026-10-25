"use client"

import MehndiAtelierTemplate from "@/components/ui/mehndi-atelier-template"

// A second house on the same template: indigo and brass, a jagua studio on
// the coast, different copy, products and photographs, euro prices.
export default function DemoIndigo() {
  return (
    <div className="w-full">
      <MehndiAtelierTemplate
        preset="indigo"
        seed={23}
        brand={{ name: "Neelam", tagline: "Jagua & Henna Studio", est: "Est. 2011 · Lisbon" }}
        announcements={["Studio walk-ins every Saturday", "Jagua gel ships chilled, next day", "Festival pop-up dates are live"]}
        bandWords={["Jagua", "Henna", "Studio", "Pop-ups"]}
        nav={[{ label: "Shop" }, { label: "Jagua" }, { label: "Henna" }, { label: "Studio" }, { label: "Events" }, { label: "Journal" }]}
        hero={{
          kicker: "Jagua fruit · Amazon basin",
          title: ["Blue-black", "Botanical"],
          sub: "Jagua gel stains indigo in a day and fades clean in a fortnight. Henna for the ceremony, jagua for the night out.",
          cta: "Shop jagua",
          photoKicker: "Festival season",
          photoTitle: "Night Collections",
          photoCta: "Book the studio",
        }}
        feature={{ kicker: "The weekender", title: "Festival kit", blurb: "Two jagua gels, a henna cone, six stencils and sealing spray, in a tin that fits a jacket pocket.", cta: "See the kit" }}
        sellers={{ kicker: "The studio", title: "Most Wanted", blurb: "What the Saturday queue is for: jagua gels first, then the henna the brides come back for." }}
        products={[
          { id: "jagua", name: "Jagua Gel", note: "15 ml · blue-black", price: 24, image: { src: "https://images.unsplash.com/photo-1565368114375-ba1a4db7099f?auto=format&fit=crop&w=900&q=80", alt: "A hand with a fine black vine design", focus: "50% 40%" }, badge: "Most wanted" },
          { id: "cones", name: "Henna Cones", note: "Set of 6 · fresh-rolled", price: 19, image: { src: "https://images.unsplash.com/photo-1782876224837-e7163083c4c7?auto=format&fit=crop&w=900&q=80", alt: "An artist piping henna onto a hand", focus: "50% 50%" } },
          { id: "stencils", name: "Night Stencils", note: "4 sheets · 60 motifs", price: 12, image: { src: "https://images.unsplash.com/photo-1566745265763-de510bdae868?auto=format&fit=crop&w=900&q=80", alt: "A hand with a floral henna design on a beige cloth", focus: "50% 50%" }, badge: "New" },
          { id: "seal", name: "Sealing Spray", note: "50 ml · aftercare", price: 9, image: { src: "https://images.unsplash.com/photo-1781377012601-93162be3a433?auto=format&fit=crop&w=900&q=80", alt: "Green henna powder in a wooden bowl", focus: "50% 50%" } },
        ]}
        collections={[
          { id: "jagua", title: "Jagua Gel", blurb: "Fruit, not dye. Blue-black in twenty-four hours, gone in fourteen days.", cta: "Shop jagua", tone: "sand" },
          { id: "henna", title: "Henna", blurb: "Hand-rolled cones from Sojat leaf for the ceremony and the week after.", cta: "Shop henna", tone: "rose" },
          { id: "studio", title: "The Studio", blurb: "Walk in on a Saturday, or book the chair for a party of six.", cta: "Book a chair", tone: "maroon" },
          { id: "events", title: "Pop-ups", blurb: "Festivals, weddings and the odd rooftop. The tin travels.", cta: "See dates", tone: "plum" },
        ]}
        heritage={{
          kicker: "Fruit & Leaf",
          title: "Two plants, one studio",
          body: [
            "Neelam opened as a two-chair studio above a tile shop in Alfama. Jagua came first, carried back from a season in Manaus; henna followed when the brides asked for it.",
            "The gel is pressed from unripe genipa fruit and shipped chilled. The henna is the same Sojat leaf the old houses use. Nothing in either jar needs a warning label.",
          ],
          cta: "The studio story",
        }}
        study={{ kicker: "The stain study", title: "Blue, then black", blurb: "Jagua goes on clear and turns indigo overnight. Henna goes on orange and turns wine. Pick one and drag the hours." }}
        shades={[
          { id: "indigo", name: "Indigo", hex: "#1f2a5c" },
          { id: "jagua", name: "Jagua black", hex: "#161425" },
          { id: "wine", name: "Henna wine", hex: "#6e2229" },
        ]}
        images={{
          hero: { src: "https://images.unsplash.com/photo-1556536088-f010a312a8d3?auto=format&fit=crop&w=1600&q=80", alt: "Two henna-covered hands against a grey wall", focus: "50% 40%" },
          feature: { src: "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?auto=format&fit=crop&w=1400&q=80", alt: "Spices and powders laid out on a wooden table", focus: "50% 50%" },
        }}
        currency="€"
        onAddToCart={(item, bag) => console.log("add", item, bag)}
        onCheckout={(bag, total) => console.log("checkout", bag, total)}
      />
    </div>
  )
}
