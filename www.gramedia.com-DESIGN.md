---
version: alpha
name: Gramedia
description: |
  Gramedia's design system embodies a modern, approachable digital bookstore
  aesthetic built on clean surfaces, confident typography, and a purposeful blue
  brand accent. The visual language prioritizes content discovery through
  high-contrast imagery, generous whitespace, and a restrained colour palette
  that lets product photography dominate. Dark neutral foundations (#000000) are
  balanced with bright white surfaces, creating visual rhythm and directing
  focus toward promotional campaigns and featured collections. The system feels
  contemporary yet accessible, with soft shadows and rounded inputs that invite
  interaction, while sharp card edges and squared button corners maintain
  structural clarity. This is a utilitarian, commerce-focused design that
  respects user scanning patterns and emphasises product-centric exploration.
source:
  url: "https://www.gramedia.com/"
  pagesAnalyzed: 1
  extractedAt: 2026-10-29
  tokensMeasured: true
colors:
  primary: "#0060AE"
  canvas: "#000000"
  surface-alt: "#2D3033"
  on-primary: "#FFFFFF"
  ink: "#FFFFFF"
  body: "#5A6166"
  muted: "#2D3033"
  hairline: "#E3E4E5"
  accent-1: "#71797F"
  accent-2: "#FFCE3B"
  neutral-1: "#C6C9CC"
  neutral-2: "#F1F2F2"
typography:
  heading-md:
    fontFamily: urbanist
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: -0.06px
  heading-sm:
    fontFamily: urbanist
    fontSize: 16px
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: 0.16px
  heading-xs:
    fontFamily: urbanist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.36px
  body-lg:
    fontFamily: urbanist
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.56
    letterSpacing: 0.09px
  body-md:
    fontFamily: urbanist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-sm:
    fontFamily: urbanist
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: 0.28px
  body-xs:
    fontFamily: urbanist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.36px
    textTransform: capitalize
  button:
    fontFamily: urbanist
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.43
    letterSpacing: 0.28px
  label:
    fontFamily: urbanist
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0.28px
  caption-sm:
    fontFamily: urbanist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0.36px
  caption-sm-strong:
    fontFamily: urbanist
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.36px
  caption-sm-2:
    fontFamily: urbanist
    fontSize: 12px
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: 0.36px
  caption-xs:
    fontFamily: urbanist
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.4px
  caption-xs-strong:
    fontFamily: urbanist
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.4px
  caption-xs-2:
    fontFamily: urbanist
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.4px
rounded:
  none: 0px
  xs: 4px
  sm: 12px
  md: 16px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 48px
  section: 76px
  band: 96px
borderWidths:
  thin: 1px
shadows:
  sm: "rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px"
elevationStrategy: single-tier
themes:
  derived: light   # the other theme is the site's measured palette
  light:
    bg: "#F9FBFD"
    surface: "#EFF1F3"
    surfaceRaised: "#E8E9EB"
    text: "#101519"
    textMuted: "#686C6E"
    border: "#D6D8DA"
    accent: "#0060AE"
    accentFg: "#FFFFFF"
    focusRing: "#0060AE"
    elevation: shadow
  dark:
    bg: "#000000"
    surface: "#2D3033"
    surfaceRaised: "#3E4143"
    text: "#FFFFFF"
    textMuted: "#5A6166"
    border: "#E3E4E5"
    accent: "#0060AE"
    accentFg: "#FFFFFF"
    focusRing: "#0060AE"
    elevation: "border+surface"
  contrastFailures:
    - "dark: muted on bg = 3.34:1 (needs 4.5:1)"
gradients:
  - context: hero
    kind: linear
    value: "linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.3))"
  - context: section
    kind: linear
    value: "linear-gradient(rgba(45, 48, 51, 0) 45%, rgba(45, 48, 51, 0.7) 70%)"
components:
  button-primary:
    typography: "{typography.button}"
    textColor: "{colors.ink}"
    height: 44px
    padding: "12px 16px 12px 16px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.primary}"
  button-filled:
    typography: "{typography.caption-sm-2}"
    textColor: "{colors.ink}"
    height: 36px
    padding: "16px 16px 16px 16px"
    rounded: 8px
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  button-outline:
    typography: "{typography.button}"
    textColor: "{colors.muted}"
    border: "1px solid {colors.neutral-1}"
    height: 46px
    padding: "12px 16px 12px 16px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.on-primary}"
  button-text:
    typography: "{typography.button}"
    textColor: "{colors.muted}"
    height: 46.5px
    padding: "12px 16px 12px 16px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.on-primary}"
  button-icon:
    typography: "{typography.body-md}"
    textColor: "{colors.canvas}"
    border: "1px solid {colors.neutral-1}"
    height: 40px
    boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px"
    rounded: 10000px
    backgroundColor: "{colors.on-primary}"
  button-icon-2:
    typography: "{typography.body-md}"
    textColor: "{colors.canvas}"
    height: 40px
    rounded: 10000px
    backgroundColor: "{colors.on-primary}"
  card:
    typography: "{typography.body-md}"
    textColor: "{colors.canvas}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    backgroundColor: "{colors.on-primary}"
  card-featured:
    typography: "{typography.caption-xs-strong}"
    textColor: "rgb(185, 17, 38)"
    padding: "0px 2px 0px 2px"
    rounded: "{rounded.xs}"
    backgroundColor: "rgb(248, 231, 233)"
  card-sm:
    typography: "{typography.body-md}"
    textColor: "{colors.canvas}"
  footer:
    typography: "{typography.body-md}"
    textColor: "{colors.canvas}"
    border: "1px solid {colors.hairline}"
  link:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
  link-2:
    typography: "{typography.caption-sm}"
    textColor: "{colors.accent-1}"
states:
  other-hover:
    target: other
    state: hover
    transform: "scale(1.2)"
    backgroundColor: "{colors.on-primary}"
  other-active:
    target: other
    state: active
    textColor: "rgb(68, 68, 68)"
    outline: none
    backgroundColor: "rgba(255, 255, 255, 0.35)"
  link-hover:
    target: link
    state: hover
    textDecoration: none
breakpoints:
  - width: 375
    containerWidth: 320
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 12
    bodyPx: 16
    sectionPaddingX: 16
  - width: 768
    containerWidth: 731
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 12
    bodyPx: 16
    sectionPaddingX: 16
  - width: 1024
    containerWidth: 731
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 12
    bodyPx: 16
    sectionPaddingX: 16
  - width: 1280
    containerWidth: 1248
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 12
    bodyPx: 16
    sectionPaddingX: 16
  - width: 1440
    containerWidth: 1376
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 12
    bodyPx: 16
    sectionPaddingX: 16
coverage:
  statesFound: 5
  gradientsFound: 2
  rolesUnassigned: 4
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Gramedia

## 1. Visual Theme & Atmosphere

Gramedia's design system embodies a **modern, approachable digital bookstore aesthetic** built on clean surfaces, confident typography, and a purposeful blue brand accent. The visual language prioritizes content discovery through high-contrast imagery, generous whitespace, and a restrained colour palette that lets product photography dominate. Dark neutral foundations (`{colors.canvas}` — `#000000`) are balanced with bright white surfaces, creating visual rhythm and directing focus toward promotional campaigns and featured collections. The system feels **contemporary yet accessible**, with soft shadows and rounded inputs that invite interaction, while sharp card edges and squared button corners maintain structural clarity. This is a utilitarian, commerce-focused design that respects user scanning patterns and emphasises product-centric exploration.

**Key Characteristics**
- Minimal colour palette anchored by primary brand blue (`{colors.primary}` — `#0060AE`)
- High contrast between dark and light surfaces for clear hierarchy
- Sharp rectangular cards and flat buttons with minimal decoration
- Generous spacing and breathing room around content
- Typography-driven layouts with consistent weight and tracking
- Product imagery as primary visual focal point
- No applied shadows on cards; depth from colour blocking only

## 2. Color Palette & Roles

### Primary
- **Primary / Brand** (`{colors.primary}` — `#0060AE`): Primary call-to-action buttons, active states, brand accent, hero overlays, and interactive highlights. Core identity colour used to drive user attention to key conversions.

### Accent Colors
- **Accent Neutral** (`{colors.accent-1}` — `#71797F`): Decorative element. No measured role; treat as optional accent for secondary visual interest where a softer grey tone is appropriate.
- **Accent Yellow** (`{colors.accent-2}` — `#FFCE3B`): Decorative element. No measured role; use sparingly for highlights or badges if brand extension is needed.

### Neutral Scale
- **Canvas / Page Background** (`{colors.canvas}` — `#000000`): Default page background and dark section bands.
- **Surface Alternative** (`{colors.surface-alt}` — `#2D3033`): Alternating section backgrounds for visual rhythm; secondary text and captions requiring reduced prominence.
- **Ink / On Primary** (`{colors.on-primary}` — `#FFFFFF`): Primary headings, labels on dark surfaces, text on brand surfaces, and high-contrast foreground text.
- **Body Text** (`{colors.body}` — `#5A6166`): Standard body copy and secondary prose.

### Interactive & Borders
- **Hairline / Border** (`{colors.hairline}` — `#E3E4E5`): 1px dividers, card borders, and subtle structural lines.

### Neutral Decorative
- **Neutral Medium** (`{colors.neutral-1}` — `#C6C9CC`): Unassigned decorative neutral; available for secondary borders or reduced-emphasis elements.
- **Neutral Light** (`{colors.neutral-2}` — `#F1F2F2`): Unassigned decorative neutral; available for very light backgrounds or disabled states.

## 3. Typography Rules

### Font Family
**Primary Font:** Urbanist (sans-serif)
Fallback stack: `Urbanist, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif`

Urbanist is the sole font family used throughout the system; no secondary serif or monospace families are declared.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Heading XS | Urbanist | 12px | 500 | 1.33 | 0.36px | Small section labels, tab titles, compact headings |
| Heading SM | Urbanist | 16px | 800 | 1.5 | 0.16px | Secondary headings, subsection titles |
| Heading MD | Urbanist | 24px | 800 | 1.33 | -0.06px | Primary section headings with tight letter-spacing |
| Body LG | Urbanist | 18px | 800 | 1.56 | 0.09px | Large display text, hero callouts |
| Body MD | Urbanist | 16px | 400 | 1.5 | 0px | Standard body paragraphs, link text |
| Body SM | Urbanist | 14px | 600 | 1.43 | 0.28px | Secondary body, metadata |
| Body XS | Urbanist | 12px | 500 | 1.33 | 0.36px | Fine print, captions with capitalization |
| Button | Urbanist | 14px | 800 | 1.43 | 0.28px | All interactive button labels |
| Label | Urbanist | 14px | 500 | 1.43 | 0.28px | Form labels, input hints |
| Caption SM Strong | Urbanist | 12px | 600 | 1.33 | 0.36px | Medium-weight captions, emphasized small text |
| Caption SM | Urbanist | 12px | 400 | 1.33 | 0.36px | Regular captions, timestamps |
| Caption SM 2 | Urbanist | 12px | 800 | 1.33 | 0.36px | Bold captions for badges |
| Caption XS Strong | Urbanist | 10px | 500 | 1.4 | 0.4px | Compact labels, small metadata |
| Caption XS | Urbanist | 10px | 400 | 1.4 | 0.4px | Minimal text, footnotes |
| Caption XS 2 | Urbanist | 10px | 600 | 1.4 | 0.4px | Semi-bold micro text |

### Principles

- **Weight as emphasis:** The system uses bold (800) sparingly for headings and button text, leaving body copy at 400–600 for breathing room. Capitals (`text-transform: capitalize`) are applied only to small metadata and utility text.
- **Tight tracking on display sizes:** Heading MD (`-0.06px` letter-spacing) demonstrates intentional negative tracking for visual tension and impact. Smaller text (captions, labels) uses positive tracking (0.28–0.4px) for clarity.
- **Consistent line heights:** All sizes maintain line-height ratios between 1.33–1.56 to ensure readable stacking and predictable vertical rhythm.
- **Hierarchy through weight, not size alone:** Body SM (600 weight) can compete visually with Body MD (400 weight) because weight carries as much emphasis as size in this system.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `{colors.primary}` (`#0060AE`)
- Text Color: `{colors.on-primary}` (`#FFFFFF`)
- Typography: `{typography.button}` (14px, weight 800, line-height 1.43)
- Padding: `{spacing.md}` top/bottom, `{spacing.md}` left/right (12px 16px)
- Height: 44px
- Border Radius: `{rounded.sm}` (12px)
- Border: none
- Box Shadow: none
- Hover: `transform: scale(1.2)`, `background-color: rgb(255, 255, 255)` (scaling and white background on hover)
- Active: `color: rgb(68, 68, 68)`, `background-color: rgba(255, 255, 255, 0.35)`, `outline: none`

**Filled Button (Secondary)**
- Background: `rgba(0, 0, 0, 0.5)` (semi-transparent black)
- Text Color: `{colors.on-primary}` (`#FFFFFF`)
- Typography: `{typography.heading-xs}` (12px, weight 800, line-height 1.33)
- Padding: `{spacing.md}` (16px all sides)
- Height: 36px
- Border Radius: 8px
- Border: none
- Box Shadow: none

**Outline Button (Tertiary)**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `{colors.surface-alt}` (`#2D3033`)
- Typography: `{typography.button}` (14px, weight 800, line-height 1.43)
- Padding: `{spacing.md}` top/bottom, `{spacing.md}` left/right (12px 16px)
- Height: 46px
- Border: `{colors.neutral-1}` (`#C6C9CC`) solid, 1px
- Border Radius: `{rounded.sm}` (12px)
- Box Shadow: none

**Text Button (Ghost)**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `{colors.surface-alt}` (`#2D3033`)
- Typography: `{typography.button}` (14px, weight 800, line-height 1.43)
- Padding: `{spacing.md}` top/bottom, `{spacing.md}` left/right (12px 16px)
- Height: 46.5px
- Border: transparent, 1px
- Border Radius: `{rounded.sm}` (12px)
- Box Shadow: none

**Icon Button (Small, Primary)**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `#000000`
- Typography: 16px, weight 400, line-height 1.5
- Width / Height: 40px
- Padding: 0 (icon-only)
- Border: `{colors.neutral-1}` (`#C6C9CC`) solid, 1px
- Border Radius: `{rounded.full}` (9999px / pill shape)
- Box Shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px`
- Hover: `transform: scale(1.2)`, `background-color: rgb(255, 255, 255)`

**Icon Button (Secondary, Borderless)**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `#000000`
- Typography: 16px, weight 400, line-height 1.5
- Width / Height: 40px
- Padding: 0
- Border: transparent
- Border Radius: `{rounded.full}` (9999px)
- Box Shadow: none

### Cards & Containers

**Default Card**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Border: `{colors.hairline}` (`#E3E4E5`), 1px solid
- Border Radius: `{rounded.md}` (16px)
- Padding: 0 (image-heavy card; padding applied to content inside)
- Width: 160px (standard product card)
- Height: 290px
- Box Shadow: none
- Text Color: `#000000`

**Featured Card Badge**
- Background: `rgb(248, 231, 233)` (light pink)
- Text Color: `rgb(185, 17, 38)` (dark red)
- Typography: `{typography.caption-xs-strong}` (10px, weight 500, line-height 1.4)
- Padding: `{spacing.xxs}` top/bottom, 2px left/right (0px 2px)
- Border Radius: `{rounded.xs}` (4px)
- Border: none
- Box Shadow: none

**Small Card**
- Background: transparent
- Border: none
- Border Radius: `{rounded.none}` (0px / sharp)
- Padding: 0
- Width: 128px
- Height: 160px
- Box Shadow: none
- Text Color: `#000000`

### Inputs & Forms

**Input Field (Text)**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `{colors.body}` (`#5A6166`)
- Border: `{colors.hairline}` (`#E3E4E5`), 1px
- Border Radius: `{rounded.full}` (9999px / pill-shaped inputs)
- Padding: inferred from form patterns; typically `{spacing.md}` (16px horizontal)
- Typography: `{typography.label}` (14px, weight 500, line-height 1.43)
- Box Shadow: none

### Navigation

**Primary Navigation Bar**
- Background: `{colors.surface-alt}` (`#2D3033`)
- Height: 64px (inferred from layout measurements)
- Text Color: `{colors.on-primary}` (`#FFFFFF`)
- Link Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Border: none
- Padding: `{spacing.md}` horizontally (16px)
- Link Hover: `color: inherit`, `text-decoration: none` (no visual change on hover; navigation remains stable)

**Category Dropdown / Secondary Navigation**
- Background: `{colors.on-primary}` (`#FFFFFF`)
- Text Color: `{colors.surface-alt}` (`#2D3033`)
- Typography: `{typography.label}` (14px, weight 500, line-height 1.43)
- Border: `{colors.hairline}` (`#E3E4E5`), 1px
- Padding: `{spacing.md}` (16px)
- Border Radius: `{rounded.sm}` (12px)

### Links

**Text Link (Default)**
- Color: `{colors.on-primary}` (`#FFFFFF`)
- Typography: `{typography.body-md}` (16px, weight 400, line-height 1.5)
- Text Decoration: none
- Hover: `color: inherit`, `text-decoration: none` (no state change)

**Secondary Link**
- Color: `{colors.accent-1}` (`#71797F`)
- Typography: `{typography.caption-sm}` (12px, weight 400, line-height 1.33)
- Text Decoration: none
- Hover: `color: inherit`, `text-decoration: none`

## 5. Layout Principles

### Spacing System

The spacing system is built on a **base unit of 4px**, scaling in increments:
- `{spacing.xxs}` = 4px — Micro-spacing between tightly grouped elements (e.g. badge padding)
- `{spacing.xs}` = 8px — Minimal spacing; icon padding, compact layouts
- `{spacing.sm}` = 12px — Small margins between adjacent content
- `{spacing.md}` = 16px — Default spacing; button padding, form fields, section margins
- `{spacing.lg}` = 20px — Medium spacing; heading margins, list item separation
- `{spacing.xl}` = 24px — Generous margin between component groups
- `{spacing.xxl}` = 32px — Large gap between major sections
- `{spacing.xxxl}` = 48px — Extra-large spacing for component boundaries
- `{spacing.section}` = 76px — Section padding vertical
- `{spacing.band}` = 96px — Full-width band separation

**Usage Context:** Buttons use `{spacing.md}` padding. Cards maintain 0 padding (content-driven). Section top/bottom padding uses `{spacing.section}` (76px). Horizontal padding on full-width sections is consistently `{spacing.md}` (16px).

### Grid & Container

- **Maximum content width:** 1376px (measured at 1440px viewport)
- **Smaller breakpoints (375–1024px):** Content width 320–731px, maintaining 16px left/right padding
- **Column count:** 4-column layout measured across all breakpoints (no single-column mobile variant observed)
- **Section padding-x:** Consistent `{spacing.md}` (16px) left/right across all viewport sizes
- **Full-width bands:** Hero carousels, promotional sections, and footer span edge-to-edge with internal content constrained

### Whitespace Philosophy

Whitespace is used **strategically to create focus and breathing room**. Large vertical gaps (`{spacing.section}` and `{spacing.band}`) separate major content zones, allowing the eye to reset between product sections and promotional campaigns. Horizontal padding is deliberately minimal (`{spacing.md}` — 16px) to maximize content real estate on smaller screens while preventing claustrophobia. Cards are **not padded internally**; images extend to their edges, with text content given clear margins below. This philosophy prioritizes content clarity over decorative space, reflecting a utilitarian commerce mindset.

### Border Radius Scale

- `{rounded.none}` = 0px — Images, cards, small cards; sharp rectilinear aesthetic
- `{rounded.xs}` = 4px — Badge corners, minimal rounding
- `{rounded.sm}` = 12px — Button corners, dropdown menus, moderate rounding
- `{rounded.md}` = 16px — Large card corners, primary container rounding
- `{rounded.full}` = 9999px — Input fields, icon buttons; pill-shaped interactive elements

**Component Application:**
- Buttons: `{rounded.sm}` (12px) or 8px for smaller secondary buttons
- Cards: `{rounded.md}` (16px) for featured products; `{rounded.none}` (0px) for thumbnails
- Inputs: `{rounded.full}` (9999px) for search and form fields
- Icons: `{rounded.full}` (9999px) for circular icon buttons

### Border Widths

- **Thin:** 1px — Applied to button borders (`outline` variant), card borders, input borders, and hairline dividers
- No thicker borders detected; the system uses single-thickness 1px borders for all structural lines

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow | Default cards, buttons, text links, most UI elements |
| Raised | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px` | Icon buttons with border; soft lift for micro-interactions |

**Shadow Philosophy:**
Gramedia employs a **single-tier, colour-blocking depth strategy**. Shadows are minimal and reserved; the visual hierarchy comes primarily from colour, contrast, and typography rather than layered shadows. The single applied shadow is a subtle, multi-layer composition (two transparent layers + two soft layers) that creates barely-perceptible depth on interactive icon buttons. This restraint keeps the interface clean and modern, preventing shadow accumulation that would muddy the visual space.

### Opacity Levels

- **56% opacity** (0.56) — Applied to semi-transparent overlays, disabled states, and muted background elements (e.g. filled button background `rgba(0, 0, 0, 0.5)`)
- **Gradient overlay on hero:** `linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.3))` — Darkens bottom half of carousel banners for text legibility
- **Section fade:** `linear-gradient(rgba(45, 48, 51, 0) 45%, rgba(45, 48, 51, 0.7) 70%)` — Progressively darkens section backgrounds

### Z-index / Layering

- **Base layers:** z-index 1, 2, 3 — Standard page content, stacked cards, and default components
- **Dropdown menus:** z-index 10, 40, 60 — Tiered dropdown stacking for nested menus
- **Sticky elements:** z-index 100 — Fixed headers, persistent navigation bars
- **Toast / modal:** z-index 2147483646 — Highest layer for notifications and overlay modals

## 7. Do's and Don'ts

### Do

- **Use `{colors.primary}` (`#0060AE`) for all primary CTAs** — Registration, checkout, main calls-to-action. This colour has proven conversion power and immediate brand recognition.
- **Apply `{rounded.full}` (9999px) to all form inputs** — Search bars and text fields should be pill-shaped for a modern, inviting feel.
- **Maintain `{spacing.md}` (16px) padding on sections** — This consistent edge margin prevents cramping on mobile and creates a predictable rhythm across layouts.
- **Use `{typography.heading-md}` (24px, 800 weight, -0.06px tracking) for primary section headings** — The negative letter-spacing creates visual punch and distinguishes major section labels.
- **Reserve shadows for icon buttons only** — Keep surfaces flat and let colour and typography carry depth. Shadows dilute the modern aesthetic.
- **Pair `{colors.body}` (`#5A6166`) with `{colors.on-primary}` (`#FFFFFF`)** — High contrast body text on light backgrounds ensures readability. On dark backgrounds, use `{colors.on-primary}` exclusively.
- **Scale interactive elements consistently** — Icon buttons scale 1.2x on hover; maintain this micro-interaction across all icon button instances.
- **Use `{typography.button}` (14px, 800 weight) for all button labels** — Consistent button typography signals interactivity and maintains visual hierarchy.

### Don't

- **Don't use secondary buttons for primary actions** — Filled buttons (`rgba(0, 0, 0, 0.5)` background) and outline buttons are for secondary flows only. Reserve blue primaries for conversion points.
- **Don't apply shadows to cards** — The card border (`{colors.hairline}` 1px) provides sufficient definition. Shadows add visual noise and conflict with the flat, modern aesthetic.
- **Don't abbreviate typography sizes** — Honour the full hierarchy; mixing unmapped sizes breaks visual consistency.
- **Don't use rounded corners on cards or images** — Cards and product thumbnails use `{rounded.none}` (0px). Sharp edges are intentional and reinforce the geometric, contemporary style.
- **Don't exceed one shadow layer** — The single raised shadow (on icon buttons) is the only depth treatment. Multi-layer shadows muddy the interface.
- **Don't mix font families** — Urbanist is the sole typeface. No serif alternatives or secondary display fonts are permitted.
- **Don't override link hover states** — Links maintain `color: inherit` and `text-decoration: none` on hover. This restraint keeps navigation stable and scannable.
- **Don't apply opacity to solid surface colours** — Opacity is reserved for overlays, disabled states, and gradients. Solid surfaces must use the full colour palette.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Width | Grid Columns | Heading (MD) | Body (MD) | Section Padding-X | Key Changes |
|---|---|---|---|---|---|---|
| 375px | 320px | 4 | 12px | 16px | 16px | Mobile: full-width, minimal margins, stacked layout |
| 768px | 731px | 4 | 12px | 16px | 16px | Tablet: wider column, maintained 4-column grid |
| 1024px | 731px | 4 | 12px | 16px | 16px | Desktop small: content width stabilizes, no grid shift |
| 1280px | 1248px | 4 | 12px | 16px | 16px | Desktop: content expands to 1248px, full-width utilization |
| 1440px | 1376px | 4 | 12px | 16px | 16px | Large desktop: max-width 1376px, full layout |

**Observed Breakpoint Strategy:**
The system uses a **fluid scaling approach** rather than discrete breakpoints. Content width increases smoothly from 320px (375px viewport) → 731px (768px) → 1248px (1280px) → 1376px (1440px). The 4-column grid persists unchanged across all sizes; no responsive column shifts occur. Navigation menu toggle remains visible across all measured viewports (no link visibility changes observed). Typography sizing (12px for Heading MD, 16px for Body) is constant; scaling is handled through viewport-relative sizing, not size changes.

### Touch Targets

- **Button height minimum:** 36px (filled buttons) to 46px (outline, text, ghost) — Exceeds 44px recommended minimum for comfortable touch targets on mobile
- **Icon button size:** 40px × 40px — Meets minimum 44px tap target guideline when accounting for default spacing
- **Card touch area:** 160px wide × 290px tall — Ample surface for touch selection
- **Input field height:** Minimum 44px inferred from primary button sizing — Comfortable for typing on mobile devices

### Collapsing Strategy

- **Horizontal overflow:** Full-width carousel sections remain fixed width and do not reflow; horizontal scroll is acceptable for promotional banners on mobile
- **Grid collapse:** No observed grid column reduction; 4-column layout maintained even at 375px, with per-item width scaling down proportionally
- **Navigation:** Hamburger menu toggle (implied from "menu toggle: yes" across all viewports) is always visible; no nav links collapse into a secondary menu (nav links visibility remains 0)
- **Padding consistency:** Left/right padding fixed at `{spacing.md}` (16px) across all breakpoints; no padding reduction observed below 1024px
- **Typography stability:** Heading and body sizing unchanged across breakpoints; visual density is managed through layout flow rather than size shifts

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Primary (`{colors.primary}` — `#0060AE`) — All main calls-to-action, brand buttons, conversions
- **Secondary CTA:** Filled (`rgba(0, 0, 0, 0.5)`) — Alternative actions, muted emphasis
- **Background (light):** On Primary (`{colors.on-primary}` — `#FFFFFF`) — Card surfaces, form fields, light sections
- **Background (dark):** Canvas (`{colors.canvas}` — `#000000`) — Page background, dark bands
- **Heading text:** On Primary (`{colors.on-primary}` — `#FFFFFF`) on dark; Surface Alt (`{colors.surface-alt}` — `#2D3033`) on light — Always high contrast
- **Body text:** Body (`{colors.body}` — `#5A6166`) on light backgrounds; On Primary (`#FFFFFF`) on dark backgrounds
- **Borders / dividers:** Hairline (`{colors.hairline}` — `#E3E4E5`) — 1px structural lines only
- **Accents (decorative):** Accent Neutral (`#71797F`), Accent Yellow (`#FFCE3B`) — No measured role; use sparingly if brand extension needed

### Iteration Guide

1. **Primary CTA buttons use `{colors.primary}` (`#0060AE`), `{typography.button}`, `{spacing.md}` padding, and `{rounded.sm}` (12px).** Hover state scales 1.2x and fills with white. Active state shows 35% white overlay.

2. **Form inputs are pill-shaped (`{rounded.full}`)** with `{colors.hairline}` border (1px) on `{colors.on-primary}` background. Use `{typography.label}` (14px) for placeholder text.

3. **Cards use `{rounded.md}` (16px) corners, `{colors.hairline}` border (1px), zero padding, and white background.** No shadows. Product images extend edge-to-edge; text content is padded below the image.

4. **All headings use Urbanist at bold weight (800).** Heading MD is 24px with -0.06px (negative) letter-spacing for visual tension. Apply to all `<h1>`, `<h2>` elements.

5. **Body copy is `{typography.body-md}` (16px, 400 weight, 1.5 line-height).** For secondary text, use `{typography.body-sm}` (14px, 600 weight). Never go below 12px for body content.

6. **Spacing follows the modular scale:** `{spacing.md}` (16px) is the default margin between components. Use `{spacing.section}` (76px) or `{spacing.band}` (96px) between major content zones. Never add custom spacing values.

7. **Section left/right padding is fixed at `{spacing.md}` (16px)** across all breakpoints (375px–1440px). Top/bottom section padding is `{spacing.section}` (76px).

8. **Shadows appear only on icon buttons.** Use the provided multi-layer shadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(50, 52, 55, 0.06) 0px 8px 12px 6px, rgba(50, 52, 55, 0.1) 0px 4px 36px 0px`. All other surfaces are flat.

9. **Navigation links don't change on hover.** Set `color: inherit` and `text-decoration: none` to maintain scannable stability. This is intentional restraint.

10. **The 4-column grid persists across all viewports (375–1440px).** Do not reduce columns on mobile. Per-item width scales; content reflows naturally. Horizontal scroll for wide sections (carousels) is acceptable on small screens.

## 10. Known Gaps

- **Interaction states not fully captured:** Only explicit `:hover` and `:active` states observed on button and link elements. Focus states (`:focus`, `:focus-visible`) and loading states are not present in extracted CSS and should be inferred from WCAG standards.
- **Error / success / warning colours absent:** The site does not expose a semantic status colour ramp. No error-red, success-green, or warning-orange states are declared. Form validation feedback, if needed, should use custom tokens outside this system or reference the single primary blue.
- **Disabled button state unclear:** No explicit disabled state CSS was extracted. Assume 56% opacity applied to disabled buttons or use `{colors.neutral-2}` (`#F1F2F2`) background as a placeholder.
- **Dark mode not observed:** The extracted tokens represent the single measured theme. A derived dark-mode variant was not captured. If dark-mode support is needed, it is out-of-scope for this document.
- **Decorative colours lack clear role:** `{colors.accent-1}` (`#71797F`) and `{colors.accent-2}` (`#FFCE3B`) have no measured usage in the UI. They are available as optional decorative accents but are not applied to any measured component. Treat as reserved for future expansion.
- **Some cross-origin stylesheets unreadable:** Third-party CDN or external stylesheet rules may not be fully captured. Component styling data is limited to in-document and directly-linked resources.
- **Authentication-gated surfaces not analyzed:** Logged-in user flows, account pages, and checkout processes were not visited. Patterns for dashboard, order history, or account settings are outside this extraction scope.
- **Animation / transition timing not specified:** CSS `transition`, `animation`, and `cubic-bezier` values were not extracted. Scale and colour hover effects are specified, but duration and easing are not available; assume 200–300ms default ease-in-out for micro-interactions.
- **Icon library not detailed:** The system uses icons (hamburger, cart, search, category badges) but the icon set name, size variants, and weight options are not documented. Assume Material Icons or Font Awesome as fallback.
- **Carousel / slider behaviour:** Dot navigation and slide transition logic are visible in screenshots but CSS animation rules were not captured. Implement as standard carousel component with fade or slide transition (duration unspecified).