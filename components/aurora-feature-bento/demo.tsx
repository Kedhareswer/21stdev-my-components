import AuroraFeatureBento from "@/components/ui/aurora-feature-bento"

export default function Demo() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-4 sm:p-10">
      <AuroraFeatureBento
        prompt="Add a *step that asks for company size* before the *pricing question*, and skip it for students."
        people={["Meera Shah", "Theo Lund"]}
      />
    </div>
  )
}
