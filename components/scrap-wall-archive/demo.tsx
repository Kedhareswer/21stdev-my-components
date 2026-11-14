import ScrapWallArchive from "@/components/ui/scrap-wall-archive"

export default function ScrapWallArchiveDemo() {
  return (
    <div className="bg-background text-foreground">
      <section className="flex min-h-[60svh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Scroll down</p>
        <p className="max-w-md text-lg">The archive pins, then zooms out into an endless wall of scraps.</p>
      </section>
      <ScrapWallArchive />
      <section className="flex min-h-[60svh] items-center justify-center px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">End of the archive</p>
      </section>
    </div>
  )
}
