"use client"

import { useEffect } from "react"
import RippleToastStack, { toast } from "@/components/ui/ripple-toast-stack"

const fire = {
  success: () => toast.success("Changes saved", { description: "Your workspace is up to date." }),
  error: () =>
    toast.error("Payment failed", {
      description: "Card ending 4242 was declined.",
      action: { label: "Retry", onClick: () => toast.success("Payment sent", { description: "$48.00 to Halcyon Studio" }) },
    }),
  info: () => toast.info("Ana joined the project", { description: "She can edit Brand / Q3 launch." }),
  warning: () => toast.warning("Storage almost full", { description: "9.2 of 10 GB used on this plan." }),
  promise: () =>
    toast.promise(new Promise((r) => setTimeout(r, 2200)), {
      loading: "Deploying to production",
      success: "Deployed in 2.2s",
      error: "Deploy failed",
      description: "main · 8f3c2a1",
    }),
  undo: () =>
    toast("Message archived", {
      description: "Moved out of your inbox.",
      action: { label: "Undo", onClick: () => toast.info("Message restored") },
    }),
}

const BUTTONS: [keyof typeof fire, string, string][] = [
  ["success", "Success", "#12b76a"],
  ["error", "Error + action", "#f04438"],
  ["info", "Info", "#2e90fa"],
  ["warning", "Warning", "#f79009"],
  ["promise", "Promise", "#7a5af8"],
  ["undo", "Undo", "#6f717a"],
]

export default function Demo() {
  // Seed a stack so the first frame shows it.
  useEffect(() => {
    const t = [
      setTimeout(() => toast.info("Ana joined the project", { description: "She can edit Brand / Q3 launch.", duration: 20000 }), 300),
      setTimeout(() => toast.warning("Storage almost full", { description: "9.2 of 10 GB used on this plan.", duration: 20000 }), 700),
      setTimeout(() => toast.success("Changes saved", { description: "Your workspace is up to date.", duration: 20000 }), 1100),
    ]
    return () => {
      t.forEach(clearTimeout)
      toast.dismiss()
    }
  }, [])

  return (
    <div className="relative flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="w-full max-w-[420px] rounded-3xl border border-border p-6">
        <p className="mb-1 text-[15px] font-semibold text-foreground">Fire a toast</p>
        <p className="mb-5 text-[13px] text-muted-foreground">Hover the stack to fan it out and pause the timers. Drag a toast sideways to dismiss it.</p>
        <div className="grid grid-cols-2 gap-2">
          {BUTTONS.map(([k, label, c]) => (
            <button
              key={k}
              type="button"
              onClick={fire[k]}
              className="flex h-11 items-center gap-2.5 rounded-xl border border-border px-3.5 text-left text-[13.5px] font-medium text-foreground transition hover:-translate-y-px active:scale-[.97]"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: "0 0 0 4px " + c + "22" }} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <RippleToastStack contained position="bottom-right" />
    </div>
  )
}
