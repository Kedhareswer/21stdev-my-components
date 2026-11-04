import AgentUsageMeter from "@/components/ui/agent-usage-meter"

export default function Demo() {
  return (
    <div className="flex min-h-[620px] w-full items-center justify-center bg-background p-4 sm:p-10">
      <AgentUsageMeter
        name="Iris · Support Agent"
        description="Monthly active processing time"
        badge="Ir"
        used={162}
        limit={320}
        resetsIn="12 days"
        rate={1.26}
        live
      />
    </div>
  )
}
