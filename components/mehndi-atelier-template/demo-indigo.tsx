"use client"

import MehndiAtelierTemplate from "@/components/ui/mehndi-atelier-template"

// A second house on the same template: indigo and brass, a jagua studio on
// the coast, different copy, products, photographs and ornaments, euro prices.
export default function DemoIndigo() {
  return (
    <div className="w-full">
      <MehndiAtelierTemplate
        preset="indigo"
        seed={23}
        brand={{ name: "Neelam", tagline: "Jagua & Henna Studio", est: "Est. 2011 · Lisbon" }}
        announcements={["Studio walk-ins every Saturday", "Jagua gel ships chilled, next day", "Festival pop-up dates are live"]}
        nav={[
          { label: "Shop", children: [{ label: "Jagua gel" }, { label: "Henna cones" }, { label: "Stencils" }] },
          { label: "Studio", children: [{ label: "Walk-ins" }, { label: "Private chair" }] },
          { label: "Events" },
          { label: "Journal" },
        ]}
        hero={{
          kicker: "Jagua fruit · Amazon basin",
          title: ["Blue-black", "Botanical"],
          sub: "Jagua gel stains indigo in a day and fades clean in a fortnight. Henna for the ceremony, jagua for the night out.",
          cta: "Shop jagua",
          photoKicker: "Festival season",
          photoTitle: "Night Collections",
          photoCta: "Book the studio",
          seal: "Pressed from genipa fruit · shipped chilled · ",
        }}
        sellers={{ lead: "Jagua & Henna", title: "Most Wanted", blurb: "What the Saturday queue is for: jagua gels first, then the henna the brides come back for." }}
        products={[
          { id: "jagua", name: "Jagua Gel", note: "15 ml · blue-black", price: 24, image: { src: "https://images.unsplash.com/photo-1556536088-f010a312a8d3?auto=format&fit=crop&w=900&q=80", alt: "Two hands covered in dark henna against a grey wall", focus: "50% 50%" }, badge: "Most wanted" },
          { id: "cones", name: "Henna Cones", note: "Set of 6 · fresh-rolled", price: 19, image: { src: "https://images.unsplash.com/photo-1782876224837-e7163083c4c7?auto=format&fit=crop&w=900&q=80", alt: "An artist piping henna onto a hand", focus: "50% 50%" } },
          { id: "stencils", name: "Night Stencils", note: "4 sheets · 60 motifs", price: 12, image: { src: "https://images.unsplash.com/photo-1780326761884-04dedf3778f8?auto=format&fit=crop&w=900&q=80", alt: "Hands with fine henna and blue bangles on a blue sari", focus: "50% 50%" }, badge: "New" },
          { id: "powder", name: "Sojat Powder", note: "100 g · triple-sifted", price: 9, image: { src: "https://images.unsplash.com/photo-1781377012601-93162be3a433?auto=format&fit=crop&w=900&q=80", alt: "Green henna powder in a wooden bowl", focus: "50% 50%" } },
        ]}
        feature={{ kicker: "The weekender", title: "Festival Tin", blurb: "Two jagua gels, a henna cone, six stencils and sealing spray, in a tin that fits a jacket pocket.", cta: "See the tin" }}
        highlights={[
          { title: "Jagua Gel", blurb: "Fruit, not dye. Indigo by morning.", cta: "Shop jagua" },
          { title: "Pop-up Chair", blurb: "Festivals, weddings, the odd rooftop.", cta: "See dates" },
        ]}
        designs={{
          kicker: "Book the chair",
          title: "Studio Styles",
          blurb: "Walk in on a Saturday or book ahead.",
          cta: "Book this style",
          items: [
            { name: "Jagua sleeve", time: "1 h", price: 60 },
            { name: "Finger rings", time: "20 min", price: 18 },
            { name: "Festival back piece", time: "90 min", price: 95 },
          ],
        }}
        collectionsHead={{ kicker: "Fruit & leaf", title: "The Studio Shelf" }}
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
          hero: { src: "https://images.unsplash.com/photo-1562508548-69377b81ab9e?auto=format&fit=crop&w=1600&q=80", alt: "Two arms covered in black henna on a teal ground", focus: "50% 40%" },
          feature: { src: "https://images.unsplash.com/photo-1583878544826-8f8c418033ed?auto=format&fit=crop&w=1600&q=80", alt: "Hennaed hands with red bangles on a gold-embroidered sari", focus: "50% 40%" },
        }}
        currency="€"
        onAddToCart={(item, bag) => console.log("add", item, bag)}
        onCheckout={(bag, total) => console.log("checkout", bag, total)}
        onNavigate={(target) => console.log("navigate", target)}
      />
    </div>
  )
}
