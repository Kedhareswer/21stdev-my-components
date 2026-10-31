"use client"

import PrismSilkFooter from "@/components/ui/prism-silk-footer"

export default function Demo() {
  return (
    <div className="w-full">
      <PrismSilkFooter preset="opal" seed={21} name="Tidewater" grain={0.55} height="700px" />
    </div>
  )
}
