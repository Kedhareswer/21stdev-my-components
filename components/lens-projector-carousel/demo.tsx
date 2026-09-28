"use client"

import LensProjectorCarousel, { type ProjectorItem } from "@/components/ui/lens-projector-carousel"

// Real photographs, so it is obvious the beam is carrying pictures. Hosted on
// Unsplash like the other photo demos in this repo; demo-drawn.tsx is the
// offline variant that paints its own stills.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&h=1200&q=80`

const items: ProjectorItem[] = [
  {
    heading: "First Light",
    title: "Above the Clouds",
    note: "The day starts before the valley knows it. Cold air, a thin line of gold, and nobody else awake.",
    label: "Wide crop, keep the horizon low",
    alt: "Mountain peaks rising above the clouds at sunrise",
    src: photo("photo-1506905925346-21bda4d32df4"),
  },
  {
    heading: "Open Country",
    title: "Long Way Round",
    note: "Distance becomes the argument. Every ridge hides another one behind it.",
    label: "Let the light fall from frame left",
    alt: "A wide mountain landscape under a soft sky",
    src: photo("photo-1500534314209-a25ddb2bd429"),
  },
  {
    heading: "Deep Green",
    title: "Still Water",
    note: "A lake that keeps the whole mountain in it. Quiet is the loudest thing here.",
    label: "Cool tones, hold the reflection",
    alt: "A green mountain lake seen from above",
    src: photo("photo-1501854140801-50d01698950b"),
  },
  {
    heading: "Night Shift",
    title: "Starfall",
    note: "Past midnight the camera does the looking. Long exposure, patient hands.",
    label: "Underexpose, let the sky glow",
    alt: "A starry night sky above a mountain range",
    src: photo("photo-1519681393784-d120267933ba"),
  },
  {
    heading: "Golden Hour",
    title: "Camp Below the Ridge",
    note: "Last frame of the roll. The tent is lit, the ridge is dark, the day is done.",
    label: "Warm highlights, deep shadows",
    alt: "A tent glowing under a mountain ridge at dusk",
    src: photo("photo-1465146344425-f00d5f5c8f07"),
  },
]

export default function Demo() {
  return <LensProjectorCarousel items={items} heading="Field Notes" cameraLabel="HD" autoplay={5500} />
}
