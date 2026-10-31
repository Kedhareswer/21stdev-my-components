"use client"

import BiryaniLegendsTemplate from "@/components/ui/biryani-legends-template"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item left
  // at width:auto shrinks the book to nothing.
  return (
    <div className="w-full">
      <BiryaniLegendsTemplate />
    </div>
  )
}
