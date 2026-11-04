import OrbitSocialBento from "@/components/ui/orbit-social-bento"

export default function Demo() {
  return (
    <div className="flex min-h-[720px] w-full items-center justify-center bg-background p-4 sm:p-10">
      <OrbitSocialBento members={48210} memberLabel="builders in 92 countries" />
    </div>
  )
}
