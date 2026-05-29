---
name: LIME Event
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#454934'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#767962'
  outline-variant: '#c6c9ae'
  surface-tint: '#566500'
  primary: '#566500'
  on-primary: '#ffffff'
  primary-container: '#b7d507'
  on-primary-container: '#4c5900'
  inverse-primary: '#b5d302'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9c8c8'
  on-tertiary-container: '#535454'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1f032'
  primary-fixed-dim: '#b5d302'
  on-primary-fixed: '#181e00'
  on-primary-fixed-variant: '#404c00'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system for this product is centered on a "Zesty Professionalism" narrative. It balances the high-energy, vibrant nature of the Tunisian music and talent scene with the reliability and efficiency of a high-end marketplace. The aesthetic is **Corporate Modern with a Minimalist twist**, prioritizing clarity, "freshness," and ease of use for both talent and bookers.

The brand personality is approachable yet authoritative. It leverages the high-contrast relationship between the signature lime green and near-black text to create a UI that feels alive and energetic. The use of generous white space (off-white backgrounds) ensures that the talent—the "product" of the marketplace—remains the focal point without visual clutter.

## Colors

The palette is driven by the primary brand color, **#b7d507 (Lime)**, used strategically for high-value actions, success states, and brand-building elements. 

- **Primary:** Lime Green is the energy source. Use it for primary buttons, focus states, and key highlights.
- **Secondary/Text:** Near-black (#2E2E2E) provides the grounding weight, ensuring excellent legibility and a professional tone.
- **Accent/Muted:** A neutral gray (#808080) handles secondary information, placeholders, and deactivated states.
- **Background:** The off-white (#F9F9F9) reduces screen glare compared to pure white, providing a "fresh" canvas for the white (#FFFFFF) card components to sit on.

## Typography

This design system uses a dual-font strategy. **Plus Jakarta Sans** is used for headlines to echo the soft, rounded forms of the lime logo, conveying friendliness and optimism. **Hanken Grotesk** is used for body text and labels for its sharp, modern precision and high legibility in data-heavy marketplace views.

Keep hierarchy strict: Headlines should be near-black (#2E2E2E) to command attention. Body text uses the same color at lower weights, while metadata and labels utilize the muted gray (#808080).

## Layout & Spacing

The layout follows a **fluid grid system** built on an 8px base unit. 

- **Desktop:** A 12-column grid with a maximum width of 1280px. Gutters are fixed at 24px to provide breathing room between talent cards.
- **Mobile:** A 4-column grid with 16px side margins. Content should be primarily stacked, with talent listings using a vertical scroll or a 2-column masonry grid if images are prominent.
- **Rhythm:** Use "Fresh Space"—generous vertical padding (48px+) between major sections to maintain the minimalist, high-end aesthetic.

## Elevation & Depth

This design system utilizes **Tonal Layering** combined with **Ambient Shadows** to create a sense of organized hierarchy.

- **Level 0 (Background):** #F9F9F9 off-white. This is the base floor.
- **Level 1 (Cards/Containers):** #FFFFFF pure white. Used for talent profiles, booking forms, and event listings. 
- **Shadow Profile:** Use a very soft, diffused shadow for cards: `0px 4px 20px rgba(0, 0, 0, 0.04)`. This creates a subtle lift without feeling heavy or dated.
- **Interactive States:** When a card or button is hovered, the shadow should deepen slightly and the element should scale up by 1% to provide tactile feedback.

## Shapes

The shape language is **Rounded (Level 2)**. This mirrors the circular nature of the lime logo and creates an inviting, accessible atmosphere.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) corner radius.
- **Large Containers:** Hero sections or large talent highlight cards use 1rem (16px).
- **Interactive UI:** Chips and tags (e.g., "Musician," "Available") should use a full pill-shape (999px) for distinct visual separation from functional buttons.

## Components

### Buttons
- **Primary:** Solid #b7d507 background with #2E2E2E text. Bold weight.
- **Secondary:** Transparent background with #2E2E2E border (2px) and text.
- **Ghost:** No border, muted gray text, turns lime on hover.

### Form Inputs
- **Field:** White background, 2px border in light gray.
- **Focus State:** 2px solid #b7d507 border with a subtle lime outer glow (3px).
- **Labels:** Small, uppercase Hanken Grotesk in #2E2E2E for clarity.

### Talent Cards
- **Structure:** White background, 1rem rounded corners, subtle shadow.
- **Imagery:** High-quality photography with a slight zoom-in effect on hover.
- **Meta-data:** Use chips for genres/tags at the bottom of the card.

### Chips/Tags
- Small, pill-shaped elements.
- **Category:** Light gray background with #2E2E2E text.
- **Status (e.g., "New"):** Light lime background with #2E2E2E text.

### Booking Calendar
- Use a clean, grid-based calendar. Selected dates should be highlighted in solid lime with white or near-black text.