# Sha Silvers — Hydrogen storefront

A Shopify Hydrogen implementation of the Sha Silvers design: a Coimbatore
manufacturer selling 925 sterling silverware — pooja thalis, plates, spoons,
tumblers, diyas, idols and gifting. Jewellery is one occasional category, not
the shop.

Built on Hydrogen `2026.4.x` (React Router 7, Vite, Oxygen).

## Running it

```bash
npm install
cp .env.example .env      # then edit SESSION_SECRET
npm run dev               # http://localhost:3000
```

With no store credentials set, Hydrogen uses Shopify's public **mock.shop**
catalogue, so the app boots with zero setup. Its products are Shopify's demo
apparel priced in USD — the layout, pricing model and checkout flow are all
real, but the articles are not silverware. Point it at a real store with
`npx shopify hydrogen link` (see `.env.example`).

### Node version

`package.json` requires Node `^22 || ^24`. On Node 20.14 npm silently skips
the `@rolldown/binding-*` optional dependency (its `engines` field excludes
that version) and `npm run dev` fails with *"Cannot find native binding"*. If
you hit that, upgrade Node — or, as a stopgap, install the binding for your
platform directly:

```bash
npm install @rolldown/binding-win32-x64-msvc --no-save --force
```

## What the design asked for, and where it lives

| Design screen | Route / component |
| --- | --- |
| 1a/1b Home | [app/routes/_index.jsx](app/routes/_index.jsx) |
| 2a/2b Category listing | [app/routes/collections.$handle.jsx](app/routes/collections.$handle.jsx) |
| 3a/3b Product | [app/routes/products.$handle.jsx](app/routes/products.$handle.jsx) |
| 4a Bag drawer | [app/components/CartMain.jsx](app/components/CartMain.jsx) via `Aside` |
| 4b/4c Checkout | [app/routes/checkout.jsx](app/routes/checkout.jsx) |
| 4c Confirmation | [app/routes/order-confirmed.jsx](app/routes/order-confirmed.jsx) |
| 5 Component sheet | `Button`, `Field`, `Chip`, `QtyStepper`, `ProductTile`, `PriceBreakdown`, `SpecTable`, `Accordion`, `RateBar` |

Design tokens — the nine colours, the two typefaces, the 0.5px hairline — are
in [app/styles/tokens.css](app/styles/tokens.css). Components read tokens; no
component inlines a hex value.

## The domain layer

Silverware carries facts Shopify has no native field for. They live in the
`sha` metafield namespace and are read in
[app/lib/pricing.js](app/lib/pricing.js):

| Metafield (`sha` namespace) | Used for |
| --- | --- |
| `nett_weight_g` | Weight on the tile, spec table, metal line (also readable per variant) |
| `making_charge` | The making line in the breakdown (also per variant) |
| `weight_tolerance_g` | `218 g (± 3 g)` |
| `purity`, `huid`, `dimensions`, `finish_note`, `made_at`, `article_code` | Spec table |

**Every one is optional.** Where a metafield is missing, weight is derived
from the price at a 10% making assumption, so the layout still renders real,
self-consistent numbers. Two rules hold either way: the total always equals
the price Shopify charges, and the lines always sum to the total.

Today's silver rate is a single module,
[app/lib/silver-rate.server.js](app/lib/silver-rate.server.js), currently
returning a constant ₹ 94.20/g. It is resolved once in the root loader and
passed down, so the rate bar, tiles, product page and bag can never disagree —
and server and client markup stay identical through hydration. Replace the
constant with the real feed and every price breakdown follows.

The same applies to the delivery promise
([app/lib/delivery.js](app/lib/delivery.js)) and the pincode → city lookup
([app/lib/pincode.js](app/lib/pincode.js)), which ships with a small table and
falls back to editable city/state fields for unknown pincodes. Each carries a
`TODO(integration)` naming what should replace it.

### Currency

Money is formatted with the currency code the Storefront API actually returns,
using the design's spacing and Indian digit grouping — `₹ 24,900` against a
real INR store, `$ 24,900` against mock.shop. The storefront never claims
rupees for prices that are not.

## Filters are URL state

Every filter chip, the sort control and the pagination cursor live in the
query string ([app/lib/collection-filters.js](app/lib/collection-filters.js)),
so a filtered listing is linkable and survives a reload. Price and weight
bands are evaluated against resolved numbers rather than Storefront facets,
because weight is a metafield rather than a native Shopify filter. Filters
therefore apply to the pages loaded so far; the count says so explicitly
rather than implying a total it has not verified.

The category nav is a fixed list of eight
([app/lib/shop.js](app/lib/shop.js)). If a store has no collection for one of
those handles yet, the listing falls back to the full catalogue under the
category's title rather than dead-ending a permanently visible nav link.
Unknown handles still 404.

## Checkout: what is real and what is not

**Hydrogen does not own payment.** Card numbers, UPI collect requests and COD
eligibility are handled by Shopify's hosted checkout.

`/checkout` implements the part a headless storefront *can* own, which is also
the part the design cares about — contact and delivery captured on one page,
as a guest, with every cost visible before the buyer commits. It:

1. validates the eight fields (including the 6-digit pincode rule and its
   error state);
2. writes email, phone and the delivery address onto the cart's buyer
   identity, and records the chosen payment method as a cart attribute;
3. redirects to `cart.checkoutUrl` for payment.

The payment radios are therefore a **preference**, shown again at the secure
step. Nothing on this page collects credentials or pretends to charge a card.

The three buttons at the top of the form ("Pay by UPI", "Google Pay", "Paytm")
preselect the method and submit the same form — they still require a delivery
address, so they are a shortcut rather than the one-tap express checkout the
design implies. The page says so above the divider. Genuine accelerated
wallets (Shop Pay, Google Pay) are enabled on Shopify's checkout, not built
here.
If you want the payment UI itself in-house, that is Checkout UI extensions or
a headless payments integration — it is not something this route can be
extended into.

`/order-confirmed` is likewise the storefront-side confirmation for when the
order-status redirect is pointed back here. It shows the reference it is given
and links to the real order record rather than reconstructing line items it
cannot verify.

## Accessibility notes

The design draws no focus ring and no keyboard affordances. Shipping that
would make the store unusable from a keyboard, so this implementation adds a
colour-only `:focus-visible` outline, consistent with the design's
"hover and focus change colour only" rule. All interactive targets meet the
44px minimum stated in section 5 — including the bag drawer stepper, which the
design drew at 30×32.

## Verified

`npm install && npm run dev`, then against the running server:

- `/`, `/collections/pooja-articles` (plain and with `?price=…&sort=…`),
  `/products/:handle`, `/cart`, `/checkout`, `/order-confirmed`, `/search` —
  all 200, no error boundary in the markup.
- Add to bag through the real cart action → line, stepper, remove, subtotal,
  shipping, GST and total all render.
- `POST /checkout` with a 4-digit pincode → renders "Pincode must be 6 digits".
- `POST /checkout` with valid details → `302` to a live Shopify checkout URL,
  with the buyer-identity update succeeding (no fallback logged).
