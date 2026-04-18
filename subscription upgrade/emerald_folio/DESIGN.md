# Design System Strategy: The Digital Heirloom

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Living Ledger."** 

This system moves beyond the cold, utilitarian nature of typical fintech apps to embrace the prestige of a traditional leather-bound shopkeeper's ledger, infused with the fluid intelligence of modern AI. It is designed for the Bangladeshi shopkeeper—someone who values both the weight of tradition and the speed of progress.

We break the "template" look through **Intentional Asymmetry**. By avoiding perfectly centered grids and using off-kilter layouts for hero elements and AI insights, we mimic the human nature of handwriting in a book. The experience feels editorial and curated, rather than programmed. High-contrast typography scales and breathing room (whitespace) ensure legibility in high-glare environments, such as a sunny storefront in Dhaka.

---

## 2. Colors
Our palette is rooted in prosperity and trust, utilizing a sophisticated Material Design tonal range.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined solely through:
- **Background Color Shifts:** Use `surface-container-low` (#f2f4f0) sections sitting on a `background` (#f8faf6).
- **Subtle Tonal Transitions:** Creating soft edges that guide the eye without the "prison-cell" feel of grid lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f8faf6).
- **Secondary Sectioning:** `surface-container` (#ecefeb).
- **Interactive Cards:** `surface-container-lowest` (#ffffff).
When nesting, an inner container should always be a step "higher" or "lower" in luminosity than its parent to create natural depth.

### The "Glass & Gradient" Rule
To elevate AI-driven elements, use **Glassmorphism**. Apply `surface_variant` with 60% opacity and a 20px backdrop blur. For primary CTAs, move away from flat hex codes; use a subtle linear gradient from `primary` (#003727) to `primary_container` (#00503a) at a 135-degree angle to provide a "silk-like" visual soul.

---

## 3. Typography
**Typeface:** Hind Siliguri (Bengali-first).
**Secondary/Numeral Support:** Manrope (for Latin characters and financial figures).

- **Display (3.5rem - 2.25rem):** Reserved for high-impact financial totals. Bold and authoritative.
- **Headline (2rem - 1.5rem):** Editorial section titles. Use asymmetric placement to break the grid.
- **Title (1.375rem - 1rem):** Sub-headings and card titles.
- **Body (1rem - 0.75rem):** Transaction details and descriptions. High line-height (1.6) for readability.
- **Label (0.75rem - 0.6875rem):** Micro-data like timestamps or metadata.

The hierarchy conveys a "Ledger First" identity—numbers are large and "prosperous," while Bengali labels are elegant and legible.

---

## 4. Elevation & Depth
We eschew traditional shadows for **Tonal Layering**.

- **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f2f4f0) section. This creates a soft "lift" that feels tactile and premium.
- **Ambient Shadows:** For floating elements like the 'Speak to AI' FAB, use a shadow with a 24px blur, 8% opacity, tinted with `on_surface` (#191c1a). It should feel like a soft glow rather than a harsh drop shadow.
- **The "Ghost Border" Fallback:** If a boundary is absolutely required for accessibility, use `outline_variant` at **15% opacity**. Never use a 100% opaque border.
- **Glassmorphism:** Apply to the 'Speak to AI' interface to allow the merchant's data to bleed through subtly, maintaining context while focusing on the AI interaction.

---

## 5. Components

### Signature 'Speak to AI' FAB
- **Styling:** XL Roundedness (`xl`: 3rem).
- **Color:** Gradient from `secondary` (#0061a4) to `secondary_container` (#77b7ff).
- **Icon:** A clean microphone or "spark" icon in `on_secondary` (#ffffff).
- **Positioning:** Offset intentionally to the bottom right with a 24px margin to break standard symmetry.

### Financial Data Cards
- **Styling:** `DEFAULT` roundedness (1rem). 
- **Structure:** No borders. Use `surface-container-lowest` against a `surface-container` background. 
- **Layout:** Intentional Asymmetry—place the primary figure (e.g., total sales) in the top-left, with supporting trends in the bottom-right.

### Divider-less Ledger Lists
- **Styling:** Remove all horizontal rules. 
- **Separation:** Use `3` (1rem) vertical spacing between items. 
- **Visual Anchor:** Use a small circular icon (`sm` roundedness) or a color-coded chip on the far left to act as a visual guide for the eye.

### Input Fields
- **Styling:** Soft-pill shapes (`lg`: 2rem roundedness). 
- **Surface:** `surface-container-highest` with no border. 
- **Focus State:** A soft 2px glow of `primary_fixed_dim` (#91d4b7) rather than a hard outline.

---

## 6. Do’s and Don’ts

### Do
- **DO** use white space as a structural element. If an element feels crowded, increase spacing using the `spacing scale` (e.g., move from `4` to `6`).
- **DO** use the `primary` green for "Growth" and "Credit" and the `tertiary` red for "Debt" or "Loss," but keep them muted to maintain the premium feel.
- **DO** ensure the Bengali text has enough "breathing room" above and below characters to accommodate matras (diacritics).

### Don’t
- **DON'T** use 1px solid lines. Ever. Use background color shifts instead.
- **DON'T** center-align everything. Embrace the "Editorial" look by left-aligning headers and right-aligning action items.
- **DON'T** use pure black (#000000). Use `on_surface` (#191c1a) for all high-contrast text to reduce eye strain in bright light.
- **DON'T** use standard "Material Design" blue. Stick to our `secondary` Dependable Blue (#0061a4) for a more custom, bespoke feel.