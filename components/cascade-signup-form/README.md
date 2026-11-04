# Cascade Signup Form

A three-step registration card: Account, then Security, then Profile. A photo panel with a pull quote and a "joined by" face stack sits beside it on wide containers and folds away below 760 px.

- Each step's fields cascade in from the side they come from, staggered.
- The progress rail fills between numbered dots, which turn into drawn checks.
- Labels float on focus.
- Errors shake the field, drop a message under it and move focus to the first problem.
- The email is checked against your server on blur, with a spinner.
- The password gets a four-segment strength meter and a live rule checklist, plus show and hide.
- Submitting spins the button, then the form turns into a welcome screen with a drawn check and a burst of confetti.

No dependencies beyond React. Instrument Serif and Geist (Latin subset) are embedded. It is laid out with a container query, so it adapts to its slot, not the window.

```tsx
import CascadeSignupForm from "@/components/ui/cascade-signup-form"

<CascadeSignupForm
  image="/signup-photo.jpg"
  avatars={["/a.jpg", "/b.jpg", "/c.jpg"]}
  checkEmail={async (email) => ((await api.emailExists(email)) ? "That email already has an account" : "")}
  onSubmit={(values) => api.signUp(values)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `image` / `imageAlt` | gradient panel | Side photo. |
| `avatars` | `[]` | Up to four faces for the joined-by chip. |
| `brand`, `headline`, `quote`, `quoteBy`, `memberCount` | Northlight demo copy | Text. `quote` is a ReactNode, and an `<em>` in it turns lime. |
| `roles` | Designer, Engineer, Founder, Product, Student | Radio chips on the last step. |
| `checkEmail` | – | `(email) => Promise<string>`. Return an error message, or `""` when the email is free. |
| `onSubmit` | – | `{ name, email, password, confirm, role, terms }`. Reject with an `Error` to show its message in an alert. |

## Validation and accessibility

Name needs 2+ characters. The email must look like an email. The password needs a "Good" strength (three of: 8+ characters, mixed case, a number, a symbol) and must match its confirmation. A role and the terms are required.

Messages appear after a field is left or after Continue. They are linked with `aria-describedby`, and fields carry `aria-invalid`. Every input has a real `<label>`. The roles are a radio group in a `fieldset` with a `legend`, so the arrow keys work. The step list marks the current step with `aria-current="step"`. Step changes, errors and success are announced politely. Enter submits each step. With `prefers-reduced-motion`, the slides, shakes, zoom and confetti are off.
