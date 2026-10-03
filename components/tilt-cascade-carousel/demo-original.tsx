"use client"

import TiltCascadeCarousel, { type TiltCascadeItem } from "@/components/ui/tilt-cascade-carousel"

// The original pen's photos and font. Local check only: 21st's capture sandbox
// refuses off-origin requests, so this demo can't be published.
const q = "?q=80&w=600&auto=format&fit=crop"
const photos: TiltCascadeItem[] = [
  { title: "cable car station", src: "https://images.unsplash.com/photo-1774565784366-72db806a40f9" + q },
  { title: "light-colored house", src: "https://images.unsplash.com/photo-1776031312164-f22c0edbdfb9" + q },
  { title: "cherry blossoms", src: "https://images.unsplash.com/photo-1777763517503-05d74f2e0008" + q },
  { title: "bottles of drinks", src: "https://images.unsplash.com/photo-1774651458632-17df84bad45e" + q },
  { title: "tree-lined road", src: "https://images.unsplash.com/photo-1778360508753-dcb2afbeadc2" + q },
  { title: "train window view", src: "https://images.unsplash.com/photo-1777221895589-2f81579e0dca" + q },
  { title: "sunlight streams", src: "https://images.unsplash.com/photo-1777763517666-b9fd2c9b6a0c" + q },
  { title: "seagulls", src: "https://images.unsplash.com/photo-1777221895551-844a3c1243b3" + q },
  { title: "pink flowers", src: "https://images.unsplash.com/photo-1777221895297-9878eb5e53f5" + q },
  { title: "paddleboarding", src: "https://images.unsplash.com/photo-1777908724790-2ec0d06d8ff7" + q },
]

export default function DemoOriginal() {
  return (
    <div className="w-full">
      <TiltCascadeCarousel
        items={photos}
        background="#ececec"
        color="#262626"
        fontHref="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
      />
    </div>
  )
}
