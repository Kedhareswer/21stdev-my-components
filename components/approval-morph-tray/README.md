# Approval Morph Tray

A dark pill that stacks the faces of everyone waiting for access. Click it and the pill grows on a spring into a panel of requests. Each row has Approve and Decline. Approving tints the avatar and draws a check, then the row folds away. Declining slides the row out. The face stack and the count update as you go, and the empty state says everyone has been answered.

```tsx
import ApprovalMorphTray from "@/components/ui/approval-morph-tray"

<ApprovalMorphTray
  resource="Q4 Brand kit · Figma"
  requests={[{ id: "1", name: "Maya Okafor", avatar: "/maya.jpg", role: "Editor access", time: "2m" }]}
  onApprove={(r) => grant(r.id)}
  onDecline={(r) => deny(r.id)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `requests` | required | `{ id, name, avatar, role, time }[]` |
| `resource` | `"Brand kit · Figma"` | Line under the count while closed. |
| `title` | `"Access requests"` | Panel heading. |
| `defaultOpen` | `false` | |
| `maxAvatars` | `4` | Faces in the pill before `+N`. |
| `onApprove` / `onDecline` | none | Called with the request. |

## Notes

- React only. No other dependencies.
- The pill is a disclosure button (`aria-expanded`, `aria-controls`). Escape closes it and returns focus. Up and Down move between rows. Decisions are announced in a polite live region.
- The height change uses `grid-template-rows`, so nothing is measured. The spring is a CSS `linear()` curve.
- Reduced motion turns every transition into an instant change.
