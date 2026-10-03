"use client"

import LedStatusSign from "@/components/ui/led-status-sign"

// Turn the dial, press the bar on top, double-click the glass to write your own.
export default function DemoSingle() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <LedStatusSign>
        <p className="pointer-events-none absolute bottom-6 left-0 right-0 px-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-black/45 dark:text-white/40">
          Turn the dial · press the bar · double-click the glass to write
        </p>
      </LedStatusSign>
    </div>
  )
}
