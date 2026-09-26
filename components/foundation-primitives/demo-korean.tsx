"use client"

import FoundationPrimitives, { DEFAULT_ITEMS } from "@/components/ui/foundation-primitives"

// The same page in Korean: copy is all props, the shapes and colours stay.
const COPY = [
  ["아이코노그래피", "하나의 키라인 그리드 위에 그린 심볼로, 모든 아이콘이 같은 무게로 읽힙니다."],
  ["Color", "색상의 시각적 일관성을 유지하고 효율적인 디자인 작업을 돕습니다."],
  ["타이포그래피", "명확한 단계의 타입 스케일로 어떤 화면에서도 위계가 유지됩니다."],
  ["스페이싱", "요소 사이의 모든 간격을 4pt 리듬 하나로 맞춥니다."],
  ["그리드", "컬럼, 거터, 마진이 모든 너비에서 레이아웃을 지탱합니다."],
]

export default function DemoKorean() {
  return (
    <div className="w-full">
      <FoundationPrimitives
        title="Foundations"
        description="모든 디자인 요소의 기반이 되는 가장 원자적인 단위들로 컬러, 타이포그래피, 스페이싱, 그리드 등 시각적 언어의 최소 단위들로 구성됩니다."
        sectionTitle="Base material"
        typeSample="기반 Foundations"
        items={DEFAULT_ITEMS.map((it, i) => ({ ...it, label: COPY[i][0], description: COPY[i][1] }))}
      />
    </div>
  )
}
