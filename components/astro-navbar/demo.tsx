"use client"

import AstroNavbar from "@/components/ui/astro-navbar"

export default function Demo() {
  return (
    <div className="w-full" style={{ minHeight: 420 }}>
      <AstroNavbar defaultTheme="dark" frame />
    </div>
  )
}
