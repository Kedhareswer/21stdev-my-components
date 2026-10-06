"use client"

import SteppedMorphSlider from "@/components/ui/stepped-morph-slider"

// Real architecture photography (Unsplash), finer steps, a thin outline and a
// warmer page — the same slider dressed for a studio's portfolio.
const U = (id: string) => "https://images.unsplash.com/photo-" + id + "?q=80&w=1800&auto=format&fit=crop"

export default function DemoPhotos() {
  return (
    <div className="w-full">
      <SteppedMorphSlider
        columns={11}
        autoplay={4600}
        outline="#1b1a17"
        background="#efe9df"
        ink="#1b1a17"
        muted="#8b8172"
        accent="#c2410c"
        slides={[
          { image: U("1488972685288-c3fd157d7c7a"), title: "Ribbon Facade", caption: "Steel bands folded over a glass core.", seed: 5 },
          { image: U("1609869644293-6714a930d4f4"), title: "Stacked Light", caption: "Balconies that read like a bar chart.", seed: 9 },
          { image: U("1486718448742-163732cd1544"), title: "White Curve", caption: "A single line, poured in concrete.", seed: 21 },
          { image: U("1511818966892-d7d671e672a2"), title: "Grid & Sky", caption: "Curtain wall looking straight up.", seed: 33 },
          { image: U("1487958449943-2429e8be8625"), title: "Quiet Volume", caption: "Sun, shadow and nothing else.", seed: 48 },
        ]}
      />
    </div>
  )
}
