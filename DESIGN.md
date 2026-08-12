# Sha Silvers — design system

## Colour strategy

**Committed.** Neutrals carry the catalogue; colour carries meaning and
structure. Three surfaces are genuinely coloured (rate bar, maker band,
confirmation), and every accent has one job. The product grid stays neutral so
silver photography never competes with the chrome.

### The anneal palette

Accents are the temper colours that appear on silver as it is heated in the
workshop, not the gold-and-maroon the category expects. Straw, steel, plum and
patina are all observable on annealed metal, which is why they belong to this
brand and not to a generic Indian retail palette.

| Role | Token | Job |
|---|---|---|
| Action | `--c-action` (moss) | The primary button. One per screen. Nothing else. |
| Accent | `--c-accent` (steel) | Links, focus rings, selected state, interactive text. |
| Editorial | `--c-editorial` (plum) | The maker band. Colour as architecture. |
| Highlight | `--c-highlight` (straw) | Money and time: savings, delivery dates, the live rate. |
| Positive | `--c-positive` (patina) | In stock, order confirmed, free shipping earned. |
| Danger | `--c-danger` | Validation only. |

Moss and steel are deliberately separated: moss became the primary button
*only*, so links moved to steel. Without that split the button stopped reading
as the single most important control on the page.

Straw is the only warm note in the system. It marks money saved and dates
promised, which is exactly what a buyer scans for.

### Neutrals

All neutrals are tinted warm (hue ~80) rather than pure grey, so silver
photography sits in a room rather than on a screenshot. No `#000`, no `#fff`.

### Themes

Light and dark are both first-class. The scene that decides dark mode: *a
buyer comparing thali weights on a phone, in bed, lights off, choosing a
wedding gift.* That forces a warm near-black, not a blue-black, because silver
against blue-black reads as a screenshot and against warm charcoal reads as a
jeweller's tray.

Dark mode is not an inversion. Chrome sits *below* the page surface in dark
(bar recedes) where it sits above in light. Accents lighten to hold contrast.

## Typography

Fraunces for headings and the wordmark only. Inter for everything read rather
than admired: prices, specs, buttons, forms, labels. Prices are always
tabular-nums.

Scale ratio ~1.25. Body prose caps at 65-75ch.

## Line and form

0.5px hairlines, square corners, no shadows, no gradients. Elevation is
communicated by surface tint, never by blur.

## Motion

150-250ms, ease-out. Motion conveys state only: quick-add fading in on hover,
the bag drawer sliding, theme crossfade. No page-load choreography.

## Interactive states

Every control ships default, hover, focus-visible, active, disabled.

**Hover changes colour only, never layout.** Where an underline appears on
hover it is reserved as a transparent border in the base state, so nothing
shifts under the cursor.

**Focus is the one deliberate departure.** Focus rings are a 2px steel
outline, not a colour change: the original design drew no focus affordance at
all, which would have made the store unusable from a keyboard, and 1px at this
palette's contrast is too easy to lose against a hairline border. Width is the
accessibility concession; the colour still comes from the accent role.

Minimum hit target 44px, including the bag drawer stepper.
