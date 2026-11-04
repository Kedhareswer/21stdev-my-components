import AgentUsageMeter from "@/components/ui/agent-usage-meter"

// Three agents on one plan: one live, one near its soft cap, one quiet.
export default function Demo() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-4 sm:p-10">
      <div className="grid w-full max-w-[1180px] grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AgentUsageMeter name="Iris · Support" description="Monthly active processing time" badge="Ir" used={162} limit={320} resetsIn="12 days" rate={1.26} live />
        <AgentUsageMeter
          name="Juno · Sales SDR"
          description="Outbound research and drafting"
          badge="Ju"
          used={238}
          limit={280}
          resetsIn="12 days"
          rate={0.94}
          accent="#e8603c"
          breakdown={[
            { label: "Model tokens", amount: 141.2, hint: "52.0M in · 9.1M out" },
            { label: "Web research", amount: 63.8, hint: "4,410 pages read" },
            { label: "Email sends", amount: 18.7, hint: "3,120 drafts · 1,940 sent" },
          ]}
        />
        <AgentUsageMeter
          name="Atlas · Research"
          description="Long-running analysis jobs"
          badge="At"
          used={46}
          limit={200}
          resetsIn="12 days"
          rate={2.1}
          accent="#1f9d7a"
          breakdown={[
            { label: "Model tokens", amount: 72.5, hint: "11.4M in · 3.2M out" },
            { label: "Sandbox compute", amount: 21.3, hint: "38 h of notebooks" },
          ]}
        />
      </div>
    </div>
  )
}
