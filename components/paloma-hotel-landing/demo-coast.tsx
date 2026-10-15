"use client"

import PalomaHotelLanding from "@/components/ui/paloma-hotel-landing"

// The same template reprinted for a sea hotel on a cliff: the "coast" preset
// swaps the mountains for a headland, the sea and a lighthouse, and recolours
// the page in salt blue, lemon and tomato. Every word below is a prop.
export default function DemoCoast() {
  return (
    <PalomaHotelLanding
      brand="Hotel Marea"
      wordmark="Marea"
      presents="A sea hotel on the Amalfi coast since 1962"
      place={["Praiano", "Amalfi coast"]}
      stamp="Est. 1962"
      preset="coast"
      demoAvailability
      clock="24h"
      currency="€"
      memo={{ text: "Marea opens for the season on 1 April. Stay four nights in May and the boat to Capri is on us.", link: "See May dates", href: "#book" }}
      hero={{
        title: "Twenty-four rooms, one salt-water pool and the whole sea below.",
        text: "Steps down to our own rocks, lemons from the terrace and an aperitivo hour that ends when the lighthouse comes on.",
        cta: "Book a room",
        secondary: "See the rooms",
      }}
      moments={[
        { label: "Sunrise swim", hour: 6.6 },
        { label: "Breakfast", hour: 9 },
        { label: "Riposo", hour: 14 },
        { label: "Aperitivo", hour: 18.2 },
        { label: "Lanterns", hour: 21.5 },
      ]}
      booking={{
        title: "Book with us, not the agency.",
        text: "Free cancellation until 14 days before arrival. Rates include breakfast on the terrace and the shuttle from Positano.",
        perks: ["Driver from Naples airport or the Salerno ferry", "Breakfast on the lemon terrace", "Sun loungers on our rocks", "A seat on the morning boat to the grotto"],
      }}
      rooms={{
        title: "Every room faces the water.",
        text: "Whitewashed walls, tiles from Vietri and shutters you will leave open. Turn a postcard over for the details.",
        items: [
          { id: "terrace", number: "4", name: "Terrace Double", rate: 260, size: "26 m²", sleeps: 2, bed: "Queen bed", text: "A tiled terrace over the pool, with two chairs pointed at the horizon.", features: ["Sea terrace", "Rain shower", "Espresso machine"], view: "pool", hour: 10.5 },
          { id: "lemon", number: "9", name: "Lemon Grove Room", rate: 310, size: "32 m²", sleeps: 3, bed: "King and a daybed", text: "On the garden level, under the pergola, where the lemons drop onto the path.", features: ["Private garden", "Hammock", "Outdoor bath"], view: "palms", hour: 17.8 },
          { id: "sea", number: "15", name: "Sea Suite", rate: 480, size: "50 m²", sleeps: 4, bed: "Two queens", text: "The corner suite with windows on three sides and the headland in the morning.", features: ["Wraparound balcony", "Soaking tub", "Binoculars"], view: "mountain", hour: 7.2 },
          { id: "tower", number: "T", name: "Tower Room", rate: 720, size: "64 m²", sleeps: 2, bed: "King bed", text: "Inside the old watchtower, with a roof deck under the lighthouse beam.", features: ["Roof deck", "Telescope", "Prosecco at sunset"], view: "night", hour: 22 },
        ],
      }}
      programme={{
        title: "A day at Marea.",
        text: "Slide the sun across the sky. The pool, the boat and the bar all keep their own hours.",
        items: [
          { hour: 6.5, until: 8.5, title: "Swim to the rocks", place: "Sea ladder", text: "The gate to the rocks opens at half past six. The water is flat and nobody else is up." },
          { hour: 8.5, until: 11, title: "Breakfast on the terrace", place: "Lemon terrace", text: "Sfogliatelle from the village, lemon cake and coffee until eleven." },
          { hour: 11, until: 13.5, title: "Boat to the grotto", place: "The jetty", text: "Our gozzo leaves at eleven for the grotto and a swim off the boat. Back for lunch." },
          { hour: 13.5, until: 17, title: "Riposo", place: "Everywhere", text: "Shutters closed, pool quiet, the village asleep. Towels and books are by the pool." },
          { hour: 17, until: 19.5, title: "Aperitivo", place: "Pool bar", text: "Spritz, olives and the light going gold on the headland." },
          { hour: 19.5, until: 22, title: "Dinner by the lanterns", place: "Terrace", text: "Fish from the morning boat and a long list of Campanian whites." },
          { hour: 22, until: 0.5, title: "Night swim", place: "Salt-water pool", text: "Pool lights on until half past midnight, with the lighthouse sweeping overhead." },
        ],
      }}
      facts={[
        { value: "18 m", label: "Salt-water pool cut into the cliff" },
        { value: "24", label: "Rooms, every one with a sea view" },
        { value: "112", label: "Steps down to our own rocks" },
        { value: "50 min", label: "By boat to Capri, from our jetty" },
      ]}
      guestbook={{
        title: "Letters to the front desk.",
        items: [
          { quote: "We swam to the rocks every morning before breakfast and never once saw another person.", name: "Hannah and Ole", stay: "Terrace Double, June" },
          { quote: "The boat captain taught our son to dive. He now refuses to swim anywhere else.", name: "The Okafor family", stay: "Sea Suite, August" },
          { quote: "The lighthouse beam crosses the tower room every eight seconds. Best night light in Italy.", name: "Luca B.", stay: "Tower Room, May" },
        ],
      }}
      visit={{
        title: "An hour from Naples, two minutes from the sea.",
        text: "We send a driver to Naples airport or the Salerno ferry. The last stretch is a road with more bends than metres.",
        address: ["Hotel Marea", "Via Gennaro 21", "84010 Praiano SA, Italy"],
        phone: "+39 089 555 0193",
        email: "ciao@hotelmarea.example",
        drives: [
          { from: "Positano", time: "10 min", dir: "left" },
          { from: "Salerno ferry", time: "35 min", dir: "right" },
          { from: "Capri by boat", time: "50 min", dir: "up" },
          { from: "Naples airport", time: "1 h 20", dir: "up-left" },
        ],
      }}
      newsletter={{ title: "Letters from Marea.", text: "Twice a season: opening dates, the first figs and which nights the boat goes out late.", button: "Write to me" }}
      footer={{ note: "Hotel Marea. Salt water, lemons, a lighthouse." }}
    />
  )
}
