"use client"

import EmberPetalPreloader from "@/components/ui/ember-petal-preloader"

// A second preset: the same garden after dark, denser, with a different seed.
export default function DemoDusk() {
  return <EmberPetalPreloader loop preset="dusk" word="Nocturne" caption="the garden after dark" density={1.25} seed={3} />
}
