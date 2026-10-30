"use client"

import SignaturePenFooter from "@/components/ui/signature-pen-footer"

export default function Demo() {
  return (
    <div className="w-full">
      <SignaturePenFooter
        word="Finished"
        title="Thank you for completing the request"
        description="Once the document has been completed, a limited-time link to a finalised copy will be emailed to you, and if you have an account, a copy will be placed in your files."
        actions={[
          { label: "Create free account", href: "#", variant: "secondary" },
          { label: "Log in", href: "#", variant: "primary" },
        ]}
        brand="Inkwell"
        height="100svh"
      />
    </div>
  )
}
