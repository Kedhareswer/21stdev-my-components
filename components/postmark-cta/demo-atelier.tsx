import PostmarkCta from "@/components/ui/postmark-cta"

export default function PostmarkCtaAtelierDemo() {
  return (
    <div className="w-full">
      <PostmarkCta preset="atelier" theme="dark" ctaHref="mailto:hello@example.com" secondaryHref="#work" />
    </div>
  )
}
