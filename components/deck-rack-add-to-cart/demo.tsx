"use client"

import DeckRackAddToCart from "@/components/ui/deck-rack-add-to-cart"

export default function Demo() {
  return <DeckRackAddToCart height="max(620px, 100svh)" onCartChange={(ids) => console.log("cart", ids)} />
}
