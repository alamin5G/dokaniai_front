# Design System Strategy: The Resilient Ledger

## 1. Overview & Creative North Star
The "Resilient Ledger" is the soul of this design system. It moves away from the fragile, line-heavy interfaces of the past toward an experience that feels as stable as a stone-carved ledger yet as fluid as modern intelligence. 

**Creative North Star: The Digital Amanat (Trust)**
We are not building a dashboard; we are building an authoritative assistant. The aesthetic is **High-End Editorial**—think of a luxury financial journal or a bespoke architectural portfolio. We achieve this by rejecting "standard" UI grids in favor of **Intentional Asymmetry**. By overlapping elements and utilizing extreme typographic contrast, we create a sense of curated intelligence rather than automated layout.

---

## 2. Colors & Surface Philosophy
The palette is rooted in 'Amanat' (Trust), using deep, foundational greens and dependable blues.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional borders create visual noise that degrades the premium feel. 
- **Boundaries** must be defined solely through background color shifts.
- **Example:** A `surface-container-lowest` card sitting on a `surface-container-low` section provides all the definition needed through tonal contrast.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine paper or frosted glass.
- **Base Surface (`#f7faf6`):** The foundational "tabletop."
- **Nesting Depth:** Use the `surface-container` tiers to create hierarchy. An inner module should always be one tier higher or lower than its parent to define its importance without needing an outline.

### Glass & Gradient (The AI Signature)
To distinguish AI-driven components from standard data, use **Glassmorphism**.
- **Token Usage:** Apply semi-transparent `surface_container_lowest` (approx 60-80% opacity) with a `backdrop-blur` (16px - 24px).
- **Signature Textures:** For primary CTAs, use a subtle linear gradient transitioning from `primary` (#003727) to `primary_container` (#00503a). This adds a "soul" and depth that flat hex codes cannot achieve.

---

## 3. Typography: The Editorial Voice
This system pairs the geometric precision of **Manrope** and **Plus Jakarta Sans** with the cultural resonance of **Hind Siliguri**.

- **Display & Headlines (Manrope):** These are your "Editorial Anchors." Use `display-lg` and `headline-lg` with tight tracking (-2%) to create an authoritative presence. 
- **The Bengali Connection (Hind Siliguri):** When rendering Bengali, maintain the same vertical rhythm. The generous spacing of the "Resilient Ledger" allows the complex scripts of Hind Siliguri to breathe without feeling cramped.
- **Precision Body (Plus Jakarta Sans):** Used for data and labels. It offers high legibility at small scales (`label-sm`), ensuring the "Ledger" remains functional and readable.

**Contrast Rule:** Always pair a large `headline-sm` with a much smaller `label-md` to create a sophisticated, non-uniform visual hierarchy.

---

## 4. Elevation & Depth
We define hierarchy through **Tonal Layering** rather than traditional structural shadows.

- **The Layering Principle:** Depth is achieved by "stacking." Place a `surface_container_lowest` card on a `surface_container_low` background. The slight shift in brightness creates a soft, natural lift.
- **Ambient Shadows:** Shadows are reserved for "floating" elements (e.g., Modals or AI Popovers). They must be extra-diffused.
    - **Blur:** 40px - 60px.
    - **Opacity:** 4% - 8%.
    - **Color:** Use a tinted version of `on_surface` (a deep green-grey) rather than pure black to mimic natural light.
- **The "Ghost Border" Fallback:** If a border is strictly required for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
- **Primary:** Gradient from `primary` to `primary_container`. High-roundedness (`xl`: 0.75rem). No border.
- **Secondary:** `surface_container_high` background with `on_surface` text. Feels integrated into the page.
- **States:** On hover, shift the tonal layer (e.g., move from `surface_container_high` to `surface_container_highest`).

### Cards & Modules
- **Construction:** Use `surface_container_lowest` (#ffffff). 
- **Separation:** Forbid the use of divider lines. Use **Vertical White Space** (from the 16px/24px/32px scale) or a 1-step background color shift to separate content blocks.

### AI Assistant Inputs
- **Special Effect:** Use the Glassmorphism rule. A floating bar with `backdrop-blur` and a `primary_fixed` accent glow. 
- **Interaction:** Upon focus, the container should not "glow" with a blue ring, but rather subtly shift its background tier or increase its backdrop-blur intensity.

### Input Fields
- **Style:** Understated. Use `surface_container_low` as the field background. 
- **Focus:** Instead of a border, use a 2px bottom-bar in `secondary` or a subtle inner-shadow shift to indicate activity.

### Chips & Tags
- **Selection:** Use `primary_fixed` for active states and `surface_container_high` for inactive. No outlines.

---

## 6. Do’s and Don'ts

### Do
- **Embrace Asymmetry:** Align text to the left but allow imagery or data visualizations to "break" the grid and bleed into the margins.
- **Prioritize Breathing Room:** If a layout feels "busy," increase the surface spacing rather than adding lines.
- **Use Tonal Depth:** Always ask "Can I define this area with a background color shift instead of a border?"

### Don't
- **Don't use 1px Borders:** This is the most common mistake. Borders make the "Ledger" look like a generic template.
- **Don't use Drop Shadows for Layout:** Shadows are for floating objects only. Use colors for depth.
- **Don't Crowd the Bengali Script:** Hind Siliguri requires more line-height than Latin scripts. Ensure `body-md` has at least 1.6x line spacing when Bengali is present.
- **Don't use Pure Black:** Use `on_surface` (#181c1a) or `on_primary_fixed` (#002116) for text to maintain the premium, organic feel.