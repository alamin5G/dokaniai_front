# Design System Strategy: The Resilient Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Resilient Ledger"**
This design system moves away from the clinical, "boxed-in" feel of traditional ERP software. Instead, it adopts the philosophy of a premium digital ledger—one that feels as authoritative as a leather-bound book but as fluid as a modern AI assistant. 

To break the "template" look, we utilize **Intentional Asymmetry**. Dashboards should not be perfectly mirrored grids; instead, we use the Spacing Scale to create breathing room, allowing critical data points (like Daily Sales) to occupy more visual "weight" than secondary navigation. By layering surfaces rather than drawing lines, we create a UI that feels carved out of a single piece of silk-finish paper, providing clarity in the high-glare environments of Bangladeshi micro-shops.

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, prosperous Green (`primary: #00503a`), balanced by a dependable Blue (`secondary: #0061a4`). This is not just a color choice; it is a signal of "Amanat" (Trust) and Halal business practices.

*   **The "No-Line" Rule:** Under no circumstances are 1px solid borders to be used for sectioning. Boundaries must be defined through background shifts. For example, a card (`surface-container-lowest`) should sit on a background of `surface-container-low`.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. 
    *   **Base:** `surface` (#f7faf6)
    *   **Sectioning:** `surface-container-low` (#f1f5f0)
    *   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **The "Glass & Gradient" Rule:** To distinguish the AI capabilities of the platform, the "Speak to AI" components should utilize a subtle gradient transitioning from `primary` (#00503a) to `primary_container` (#006a4e) with a 20px backdrop-blur to create a "frosted emerald" effect.

## 3. Typography
We utilize **Hind Siliguri** as our cultural anchor. It is a Bengali-first font that provides exceptional legibility for shop owners.

*   **Display Scale (`display-lg` to `display-sm`):** Reserved for high-impact financial totals. These should feel monumental. 
*   **Headline Scale:** Used for page titles (e.g., "Today’s Baki"). 
*   **The Editorial Contrast:** We pair the organic curves of Hind Siliguri with a strict adherence to the **Spacing Scale**. Headlines should have generous `top-margin` (e.g., `8` or `10`) to separate the "Story" of the shop from the "Data" of the shop.
*   **Labels:** Use `label-md` for micro-copy like "Received 2 mins ago," ensuring the `on-surface-variant` color provides enough contrast without distracting from the main numbers.

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering**, not shadows.

*   **The Layering Principle:** To lift a "Baki" (Credit) card, do not add a shadow. Instead, place the card (`surface-container-lowest`) on a `surface-container-high` background. This creates a soft, natural "pop."
*   **Ambient Shadows:** If a floating element (like a Voice Recording Modal) is required, use a shadow with a 48px blur at 6% opacity, tinted with the `on-surface` color.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a container edge (e.g., in extremely high-glare sunlight), use the `outline-variant` at 15% opacity. Never use a 100% opaque border.
*   **Glassmorphism:** Navigation rails and the 'Speak to AI' trigger must use `surface_bright` with a 12px blur, allowing the lush greens of the dashboard to subtly bleed through.

## 5. Components

### The Signature 'Speak to AI' Button
*   **Visual:** A floating action button (FAB) using `xl` (1.5rem) roundedness.
*   **Style:** A gradient fill from `primary` to `primary_container`. 
*   **Icon:** A large microphone icon, centered.
*   **Interaction:** On tap, the button expands into a glassmorphic bottom sheet using `surface-tint` at low opacity.

### Financial Data Cards
*   **Structure:** No borders. `md` (0.75rem) roundedness.
*   **Content:** The numeric value uses `display-md`. The label (e.g., "Total Cash") uses `title-sm` in `on-surface-variant`.
*   **Spacing:** Internal padding must be at least `4` (1.4rem).

### Lists (The "Baki" Ledger)
*   **Forbid Dividers:** Do not use horizontal lines between customers.
*   **Separation:** Use a `surface-container-low` background on hover, and `spacing-2` of vertical whitespace between items.
*   **Large Icons:** Every list item must have a recognizable icon (e.g., a paper ledger icon for debt) using the `secondary` color.

### Input Fields
*   **Style:** Minimalist. No bottom line. A soft `surface-container-highest` fill with `sm` (0.25rem) roundedness.
*   **Focus State:** Transition the background to `primary-fixed-dim` with a "Ghost Border" of `primary`.

## 6. Do’s and Don’ts

### Do:
*   **Do** use `spacing-6` (2rem) for outer page margins to create an "Editorial" layout.
*   **Do** prioritize large touch targets (minimum 48x48px) for shop owners who may be multi-tasking.
*   **Do** use the `tertiary` (#74302a) color strictly for negative "Baki" or "Out of Stock" alerts to maintain high urgency.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Always use `on-surface` (#181d1a) to keep the look sophisticated and soft.
*   **Don’t** cram more than three cards in a single horizontal row on tablet views. Let the data breathe.
*   **Don’t** use standard "system" icons. Use custom, thick-stroke illustrative icons that represent Bangladeshi shop items (e.g., a specific "Sack" for wholesale products).