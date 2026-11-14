"use client"

import SwingPanelNav from "@/components/ui/swing-panel-nav"

export default function Demo() {
  return (
    <SwingPanelNav>
      <div className="absolute bottom-8 left-6 right-6 sm:bottom-12 sm:left-11 max-w-[34rem]">
        <p
          className="m-0 text-[13px] uppercase tracking-[0.18em]"
          style={{ color: "color-mix(in oklab, var(--color-background, #fff) 55%, transparent)" }}
        >
          Kedhareswer · Designer &amp; developer
        </p>
        <p
          className="mt-3 mb-0 text-2xl leading-snug sm:text-3xl"
          style={{ color: "var(--color-background, #fff)" }}
        >
          Interfaces that move with intent. Open Work or About to swing the menu in.
        </p>
      </div>
    </SwingPanelNav>
  )
}
