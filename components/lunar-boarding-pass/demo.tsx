"use client"

import LunarBoardingPass from "@/components/ui/lunar-boarding-pass"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="flex min-h-[560px] w-full flex-col items-center justify-center bg-[#e5e5e2] px-4 py-16 sm:px-10 dark:bg-[#111112]">
      <LunarBoardingPass />
      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
        Sweep across the moon &middot; point at the art &middot; click to turn &middot; tear the stub
      </p>
    </div>
  )
}
