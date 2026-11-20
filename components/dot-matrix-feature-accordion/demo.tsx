"use client"

import DotMatrixFeatureAccordion from "@/components/ui/dot-matrix-feature-accordion"

const settings = {
  interval: 1850,
  autoPlay: true,
}

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }
  return <DotMatrixFeatureAccordion interval={s.interval} autoPlay={s.autoPlay} />
}
