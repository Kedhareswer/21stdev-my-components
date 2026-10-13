# pigment-experience-ledger: review log

Reference: ui-layouts "Experience" block preview,
https://github.com/ui-layouts/uilayouts/blob/main/packages/blocks/assets/experience-section.png
(saved as `reference.png`). Used for feel and layout only: big right-aligned
wordmarks, italic year ranges, a row that opens with an ×, a warm pink-orange-yellow
smear behind the open row. No brand, text, logo or image copied.

Found through the 21st `get_inspiration` tool first, but `cdn.21st.dev`, Unsplash,
Awwwards, Dribbble and the other galleries are blocked by this sandbox's egress
policy, so the reference came from a public GitHub repo, and the art is painted at
runtime instead of using photos.

## Idea gate (fresh critic)

Five takes: experience ledger, company milestones, client index, changelog, open
roles. Picked **1, experience ledger**: every portfolio needs one, the library has
none, it keeps the reference's grammar, and type plus generated pigment carry the
look without photos. The others were rejected as thinner versions of the same idea,
a common hover-card pattern too close to index-list-carousel, a stock SaaS widget,
and a jobs board whose long titles break the one-line wordmark.

## Round 1: REDO (average 7.2)

| | Score |
|---|---|
| Usability | 8 |
| Idea | 7 |
| Craft | 6 |
| Originality | 6 |
| Install-safety | 9 |

Changes asked, most important first:
1. Centre the wash on the measured wordmark and keep it in one piece (tighter span, less drift).
2. No flat cut at the row rules: apply the envelope to the field, wider feather.
3. Keep the wash in the header band, off the body copy.
4. Kill horizontal streaks from the axis-stretched hue noise.
5. Read as watercolour: narrower fringe, darker tide-line rim.
6. Dark mode: keep saturation, cap alpha instead of darkening the hue.
7. One focal point: dim the open row's wash while another row is hovered.
8. Per-item pigment colours; a label prop for the tags list.
9. CTA underline stub at rest looks broken.

All nine changes made: the wash is centred on the measured wordmark, with spread
tied to its width and less drift. It is enveloped to the header band through the
field, so it gets ragged edges and no flat cuts. It has a side bleed that adapts
to the page gutter, rotated hue noise, a narrower fringe and a warm tide-line rim.
Dark mode drops the palest stop and caps alpha. The open row steps back to 0.3
while another row is pointed at. There are per-item `colors` (shown in demo-tide)
and `labels.tags`. The CTA underline is full width at rest and thickens on hover.

## Round 2: REDO (average 7.2)

| | Score |
|---|---|
| Usability | 8 |
| Idea | 7 |
| Craft | 6 |
| Originality | 6 |
| Install-safety | 9 |

Asked: dark-mode pigment going rust and brown, the tide demo not showing tide, the
wash crossing the row rules and the body copy, an 800px pointer comet, an outer-glow
rim, en dashes for years, a logo slot and heading level, a loop that never sleeps,
the `minHeight` default.

Done: the dark ramp keeps its saturation and has crisp edges. The tide demo opens
its teal row, Bramble keeps its own colours, and each role has a small mark through
the new `logo` prop. The envelope stops at the row's hairline and the header band.
Pointer lean is clamped to the wordmark. Rim thickness is noise-varied, the rim
alpha is lower and the hue streaks are wider. `headingLevel` was added. The loop
sleeps 3 s after the last activity, the resize effect is keyed on names, and the
README documents `minHeight="auto"`. Not done: en dashes. The owner's awwwards skill
bans em and en dashes in visible text, so year ranges stay hyphenated.

Added for originality: the wash is drawn from the work history. A longer tenure
paints a longer stroke (`reachOf`), and older roles have drier, paler, grainier
pigment (`drynessOf`, with granulation only on dark surfaces). Turn it off with
`ageing={false}`.
