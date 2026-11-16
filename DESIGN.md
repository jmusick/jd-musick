---
name: JD Musick
description: Late-night electric blues and soul, set in warm black, aged cream and one ember of orange.
colors:
  last-call-black: "#0a0a08"
  back-booth-black: "#11110e"
  blackened-wood: "#171713"
  old-varnish: "#3b362a"
  aged-cream: "#f4ead8"
  faded-cream: "#c8bca8"
  ash-tan: "#8d806e"
  ember-orange: "#d94f26"
  ember-glow: "#e5865f"
  hot-coal: "#ffc0a5"
  flare: "#ee653c"
  wet-brick-rust: "#7f201d"
  scorched-rust: "#5b1e16"
typography:
  brand:
    fontFamily: "Bebas Neue, Arial Narrow, sans-serif"
    fontSize: "clamp(1.9rem, 3vw, 2.65rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.19em"
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(48px, 7vw, 96px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
  subtitle:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
  lede:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "0.06em"
  label:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.22em"
  nav:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.22em"
  footer-mark:
    fontFamily: "Roboto Slab, serif"
    fontSize: "22px"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "10px"
  lg: "20px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.back-booth-black}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "13px 28px"
  button-primary-hover:
    backgroundColor: "{colors.flare}"
    textColor: "{colors.back-booth-black}"
  button-primary-lg:
    padding: "17px 36px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.aged-cream}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "13px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.faded-cream}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "13px 28px"
  button-ghost-hover:
    textColor: "{colors.aged-cream}"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.ember-orange}"
    typography: "{typography.label}"
    rounded: "2px"
    padding: "5px 12px"
  badge-filled:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.back-booth-black}"
    typography: "{typography.label}"
    rounded: "2px"
    padding: "5px 12px"
  panel:
    backgroundColor: "{colors.blackened-wood}"
    rounded: "{rounded.lg}"
    padding: "clamp(20px, 3vw, 32px)"
  input:
    backgroundColor: "{colors.back-booth-black}"
    textColor: "{colors.aged-cream}"
    typography: "{typography.lede}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.ash-tan}"
    typography: "{typography.nav}"
    padding: "8px 12px"
  nav-link-active:
    textColor: "{colors.aged-cream}"
  social-link:
    backgroundColor: "transparent"
    textColor: "{colors.faded-cream}"
    rounded: "{rounded.pill}"
    size: "40px"
  social-link-hover:
    textColor: "{colors.ember-glow}"
  track-row:
    textColor: "{colors.aged-cream}"
    padding: "16px 12px"
---

# Design System: JD Musick

## Overview

**Creative North Star: "After Last Call"**

The site is the bar after closing. The chairs are up, the room has gone dark, and one warm light is still on. Almost everything is warm black, and the album photograph supplies the atmosphere. Ember orange is the single lit object in the room: it marks the thing to do next, usually "Listen." Copy is set in cream on black and reads like a menu card held up to that light. The tone is quiet, worn and a little smoky, never loud.

The pages are sparse. There is a lot of black space, few elements, and one clear action per view. Hierarchy comes from tall condensed headlines, letter-spaced uppercase labels and hairline rules, not from boxes and colour blocks. The album cover is the only image and the only source of texture. Everything else stays out of its way.

The system rejects two looks outright. It is not neon or synthwave: no cool electric hues and no glowing tubes. It is not Americana kitsch: no barbed wire, whiskey barrels, rope type or guitar clip art. The mood comes from the actual record, not from blues iconography.

**Key Characteristics:**
- Warm near-black ground. No neutral greys and no pure black.
- One saturated accent, ember orange, reserved for action and the current state.
- Tall condensed display type. Small, widely tracked uppercase labels.
- Hairline borders and tonal steps carry the structure. Shadows are rare.
- The album artwork is the hero image and the colour source.

## Colors

The palette comes from the album artwork: blackened wood, wet brick, aged cream and one ember of orange.

### Primary
- **Ember Orange** (ember-orange): The action colour. It fills the primary button, underlines the active nav item and fills or outlines release badges. On black it measures 4.8:1, so it can carry badge text there. On panels (4.4:1) it must not carry small text.
- **Ember Glow** (ember-glow): The lighter ember for text-sized accents: links, eyebrow labels, the social-icon hover and the keyboard focus ring (2px outline, 3px offset). At 7.5:1 on black it is the readable form of the accent.
- **Hot Coal** (hot-coal): Link hover only.
- **Flare** (flare): The primary button's hover fill, also used for form error text (6.2:1 on black).

### Secondary
- **Wet-Brick Rust** (wet-brick-rust): An atmosphere colour, never used for text (2.0:1). It appears in the radial glow at the top right of every page, the offset shadow behind the wordmark and hero title, the track-row hover wash (30% alpha) and the left rule on the development note.
- **Scorched Rust** (scorched-rust): Only the hard drop shadow under the primary button.

### Neutral
- **Last-Call Black** (last-call-black): The page ground everywhere.
- **Back-Booth Black** (back-booth-black): One step lighter. It is used for form input wells and as the text colour on ember fills.
- **Blackened Wood** (blackened-wood): Raised surfaces such as panels, the contact form and the Spotify embed frame.
- **Old Varnish** (old-varnish): Every hairline, including borders, dividers, track separators, the header's bottom edge and ghost-button outlines.
- **Aged Cream** (aged-cream): Headings, labels, active nav and input text. Contrast is 16.6:1.
- **Faded Cream** (faded-cream): Default body copy and ledes (10.6:1).
- **Ash Tan** (ash-tan): Metadata, track numbers, durations, hints, idle nav and the footer (5.1:1 on black, 4.7:1 on panels). This is the floor for readable text.

### Named Rules
**The One Ember Rule.** Ember orange is the only saturated hue on the page, and it always means "this is the action" or "you are here." Never use it as decoration, as a section background or on more than one button per group.

**The Warm Black Rule.** Every neutral leans warm (yellow-brown). Don't introduce cool greys, blue-blacks or `#000`. The hero title's pure white is the single exception.

**The Hairline Gradient Rule.** The ember gradient (rust to ember to a dusty gold, `#e0b467`) appears only as a 1px line at reduced opacity: the section rule (35%) and the top edge of the contact form (75%). It never fills a surface or sets text.

## Typography

**Display Font:** Barlow Condensed (fallback sans-serif)
**Body Font:** Libre Franklin (fallback sans-serif)
**Brand Font:** Bebas Neue (fallback Arial Narrow), for the wordmark only
**Mark Font:** Roboto Slab, for the footer name only

**Character:** Tall, tight condensed headlines echo the artist credit on the album cover. Below them sits a sturdy, plain grotesque that keeps long copy easy to read. Uppercase plus wide tracking does the labelling work that weight and size do elsewhere.

### Hierarchy
- **Brand** (Bebas Neue 400, clamp(1.9rem, 3vw, 2.65rem), 0.19em tracking): "JD MUSICK" in the header with a 2px rust offset shadow. Tracking tightens to 0.14em under 480px.
- **Display** (Barlow Condensed 700, clamp(48px, 7vw, 96px), line-height 1.05, −0.035em, uppercase): The home-page hero title only. It is set in pure white with a 4px rust offset shadow and capped at 12ch.
- **Headline** (Barlow Condensed 700, 40px, 1.15): Page h1.
- **Title** (Barlow Condensed 700, 30px, 1.15): Section h2.
- **Subtitle** (Barlow Condensed 700, 22px, 1.15): h3 and privacy-policy section heads.
- **Lede** (Libre Franklin 400, 19px, 1.55, max 60ch): Intro paragraphs, bios, policy lists and input text.
- **Body** (Libre Franklin 400, 16px, 1.55): Default copy in Faded Cream.
- **Button** (Libre Franklin 700, 15px, 0.06em, uppercase): Large buttons use 16px, small buttons 13px.
- **Nav** (Libre Franklin 600, 14px, 0.22em, uppercase): Primary navigation.
- **Label** (Libre Franklin 600, 12px, 0.22em, uppercase): Eyebrows (Ember Glow) and badges (Ember Orange).
- **Meta** (Libre Franklin, 14px, 0.06em, often uppercase): Release metadata row, track numbers and durations in tabular figures, and the footer.

### Named Rules
**The Condensed Voice Rule.** Every heading is Barlow Condensed 700. Bebas Neue belongs to the wordmark and Roboto Slab to the footer mark. Neither spreads to other text.

**The Tracked Caps Rule.** Uppercase text is always letter-spaced: 0.06em for buttons and metadata, 0.22em for labels and nav. Body copy and headlines (other than the hero) stay in sentence case.

## Layout

There is a single centred column, up to 1200px wide, with a fluid side gutter of clamp(16px, 3vw, 32px) shared by the header, pages and footer. Pages open with 64px of top padding and close with 96px. Major sections are separated by 96px. Gradient rules sit inside 48px margins. A form-focused page such as Contact narrows to 820px.

The spacing scale is a 4px base, stepping 4, 8, 12, 16, 24, 32, 48, 64 and 96. Components use the small end (8–24px). Page rhythm uses the large end (48–96px).

The home hero is full-bleed. It is up to min(84vh, 760px) tall, with the album art at 68% opacity under a scrim that is solid black on the left and clears to the right, so the text sits in shadow and the photo shows through. Under 900px the scrim turns vertical (75% → 95% black, top to bottom). The Music page pairs a 340px cover with release metadata in a two-column grid. The tracklist is a three-column grid: number, title with note, and duration.

**Breakpoints:**
- **900px:** The navigation collapses behind a 42px menu toggle and expands to full-width stacked links. The release grid becomes a single column. The footer stacks and centres. The page background stops being fixed.
- **480px:** Hero buttons go full width, the wordmark shrinks, and the tracklist number column narrows.

## Elevation & Depth

Depth comes mainly from tonal steps (Last-Call Black → Back-Booth Black → Blackened Wood) and Old Varnish hairlines. Shadows are rare and come in two kinds. **Soft shadows** are large, dark and diffuse, and they appear only on the album cover and the contact form. **Hard offset shadows** are flat, unblurred rust blocks under the primary button, the hero title and the wordmark. They are part of the current look but are not a rule new work has to follow.

The header is the one glass layer. It is sticky, 90% Last-Call Black with a 16px backdrop blur and a hairline bottom border. Behind every page, a rust radial glow (20% alpha) sits at the top right.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 12px 32px rgba(0,0,0,0.55)`): The album cover at rest.
- **Card hover** (`box-shadow: 0 20px 48px rgba(217,79,38,0.18), 0 12px 32px rgba(0,0,0,0.6)`): The album cover on hover, along with a 4px lift.
- **Form ambient** (`box-shadow: 0 0 44px rgba(217,79,38,0.09), 0 12px 32px rgba(0,0,0,0.55)`): The contact form panel.
- **Ember focus** (`box-shadow: 0 0 0 2px rgba(217,79,38,0.18), 0 12px 36px rgba(217,79,38,0.2)`): Focused input fields.
- **Offset, primary** (`box-shadow: 5px 5px 0 #5b1e16`): The primary button.
- **Offset, secondary hover** (`box-shadow: 4px 4px 0 rgba(127,32,29,0.32)`): The secondary button on hover.

### Named Rules
**The Dark Room Rule.** Build separation with a tonal step or a hairline first. A soft shadow is for content that should feel lifted off the table, such as the record sleeve or the form. Don't put one on every card.

## Shapes

The shapes are mostly squared off, with a few softer exceptions. Interactive controls (buttons, inputs, menu toggle) use a near-square 4px corner. Badges are almost sharp at 2px. Containers soften as they grow: the album cover has a 10px corner, and panels such as the contact form, bio and fallback notice have a generous 20px corner. Social icon buttons are 40px circles. Borders are always 1px Old Varnish hairlines, except the secondary button's 1.5px inset ember outline and the 2px ember underline on the active nav item.

## Components

### Buttons
They are flat, uppercase and heavy, like a label on a road case.
- **Shape:** Near-square corners (4px). Padding is 13px × 28px by default, 17px × 36px for large and 9px × 20px for small.
- **Primary:** Ember Orange fill with Back-Booth Black text and a 5px Scorched Rust offset shadow. Use it for the one main action in a group ("Listen on Spotify", "Send message", "Back home").
- **Secondary:** Transparent, with a 1.5px inset Ember Orange outline and Aged Cream text, for the action beside the primary.
- **Ghost:** Transparent, with a 1px inset Old Varnish outline and Faded Cream text, for lists of equal-weight outbound links (the About page's "Elsewhere").
- **Hover / Focus:** Primary brightens to Flare and lifts 1px. Secondary lifts 1px and gains a soft rust offset. Ghost brightens its text and outline. Focus uses the global 2px Ember Glow outline at a 3px offset. Transitions run 120–220ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Disabled:** 40–50% opacity with no shadow.

### Badges
- **Style:** 12px uppercase label with 0.22em tracking, padded 5px × 12px, 2px corners. The outline form uses an Ember Orange border and text. The filled form uses an Ember Orange fill with Back-Booth Black text. A neutral form (Faded Cream outline) exists in the CSS but isn't used.
- **Use:** Release status ("Out now", "Debut Album · Out now").

### Cards / Containers
- **Corner Style:** Large (20px).
- **Background:** Blackened Wood.
- **Shadow Strategy:** None by default. The contact form alone carries the form-ambient shadow plus a 1px ember-gradient line inset 24px along its top edge.
- **Border:** 1px Old Varnish.
- **Internal Padding:** clamp(20px, 3vw, 32px).

### Inputs / Fields
- **Style:** Back-Booth Black well, 1px Old Varnish border, 4px corners and 19px Aged Cream text. Labels above are bold, uppercase and tracked in Aged Cream. Hints and the "optional" tag are set in Ash Tan.
- **Focus:** The border turns Ember Glow and the ember focus glow appears. The default outline is suppressed only here, because the glow replaces it.
- **Status:** A polite live region below the submit button reports progress in Faded Cream, success in Aged Cream and errors in Flare.

### Navigation
- **Style:** Uppercase Libre Franklin at 14px with 0.22em tracking, in Ash Tan.
- **States:** Hovered links turn Aged Cream. The active link is Aged Cream with a 2px Ember Orange underline.
- **Header:** The wordmark sits on the left. The nav, a short vertical hairline and the social icon buttons sit on the right.
- **Mobile (≤900px):** A 42px outlined toggle swaps between menu and close icons. The menu expands below the header as full-width stacked links with hairline separators, followed by a centred row of social icons. Without JavaScript the menu stays open.

### Social Icon Buttons
They are 40px outlined circles (1px Old Varnish) holding 18px brand glyphs in Faded Cream. On hover the glyph and outline turn Ember Glow. They appear only for profiles with real URLs, in the header, footer and Contact page.

### Tracklist (signature)
The album's songs are shown as a ruled list rather than cards. Each row has a two-digit number in Ash Tan tabular figures, the title in Barlow Condensed with a one-line note in Ash Tan below it, and the duration right-aligned. Rows are separated by Old Varnish hairlines with a hairline above the first. Hovering a row washes it in rust at 30% alpha.

### Album Hero (signature)
The cover photograph fills the hero at 68% opacity behind a directional black scrim. Above it sit the filled release badge, the giant uppercase display title with its rust offset shadow, a lede limited to 46ch and a primary/secondary button pair.

## Do's and Don'ts

### Do:
- **Do** keep page grounds Last-Call Black (`#0a0a08`) and raised surfaces Blackened Wood (`#171713`), with 1px Old Varnish hairlines between them.
- **Do** spend Ember Orange on one action or one current state per view. Use Ember Glow (`#e5865f`) when the accent has to carry small text.
- **Do** set headings in Barlow Condensed 700 and any uppercase text with tracking (0.06em or 0.22em).
- **Do** let the album artwork carry the imagery. A new image must come from the record's world, approved by the artist.
- **Do** keep text at Ash Tan (`#8d806e`) or brighter, and keep the 2px Ember Glow focus outline on every interactive element.
- **Do** honour `prefers-reduced-motion`. The global stylesheet already reduces all transitions to near zero.

### Don't:
- **Don't** use neon or synthwave styling: no electric blues or magentas, no glowing tube effects and no cool-toned glows. The legacy `.badge-blue` class name is ember-coloured. Don't take it as permission for blue.
- **Don't** use Americana kitsch: no barbed wire, whiskey barrels, distressed rope or Western type, guitar clip art or wood-grain textures standing in for the album's photography.
- **Don't** set text in Wet-Brick Rust (2.0:1) or small text in Ember Orange on Blackened Wood panels (4.4:1).
- **Don't** introduce cool greys, blue-blacks or pure `#000`.
- **Don't** use the ember gradient as a fill or as text. It is a 1px hairline only.
- **Don't** add new display faces. Bebas Neue stays on the wordmark and Roboto Slab on the footer mark.
