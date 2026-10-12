# Alice Scroll Story

A scroll-driven story page: an intro heading, then Alice illustrations and
text panels that pin, scale and slide in as you scroll, choreographed with GSAP
ScrollTrigger. Published on 21st.dev as
[Alice Scroll Story](https://21st.dev/@kedhareswer/components/alice-scroll-story).

```tsx
import AliceScrollStory from "@/components/ui/alice-scroll-story"

<AliceScrollStory />
```

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger` plugin). This is the one
  component in the repo that needs it; it is declared in the root
  `package.json`.

## Notes

- Styles live in a scoped `<style>` block inside the file, so nothing needs to
  be imported separately.
- The illustrations load from `cdn.21st.dev`.
- The authoring project (Vite app, publish scripts) lives outside this repo in
  `../alice-component`. This folder holds the published file verbatim, so the
  repo and 21st stay in sync.
