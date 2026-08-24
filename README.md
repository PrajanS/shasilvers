# Sha Silvers — Hydrogen storefront

A Shopify Hydrogen implementation of the Sha Silvers design: a Coimbatore
manufacturer selling 925 sterling silverware — pooja thalis, plates, spoons,
tumblers, diyas, idols and gifting. Jewellery is one occasional category, not
the shop.

Built on Hydrogen `2026.4.x` (React Router 7, Vite, Oxygen).

## Running it

```bash
npm install
cp .env.example .env      # then fill in the store credentials
npm run dev               # http://localhost:3000
```

Every product, collection, cart and checkout comes from the Storefront API —
there is no offline catalogue, so a linked store is required to boot. Fill in
`.env` by hand from Settings → Apps → Headless in the Shopify admin, or let
`npx shopify hydrogen link` write it for you (see `.env.example`).

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

**The price of an article is calculated, not looked up:**

    price = today's rate for its metal × its nett weight + making charge

No tax is added — the calculated figure is the figure. The facts it needs live
in the `sha` metafield namespace on the product (or on the variant, where a
size changes the number) and are read in
[app/lib/pricing.js](app/lib/pricing.js):

| Product metafield (`sha`) | Type | Used for |
| --- | --- | --- |
| `metal` | single line | **Which rate the price is struck at**, and the Metal row |
| `nett_weight_g` | integer or decimal | **Multiplied by the rate.** Also the weight on the tile and spec table |
| `making_charge` | decimal | **Added on top.** Absent means none |
| `weight_tolerance_g` | decimal | `218 g (± 3 g)` |
| `purity`, `huid`, `dimensions`, `finish_note`, `made_at`, `article_code` | single line | Spec table |

Name, description and images are Shopify's own fields — nothing here
duplicates them.

**Nothing is estimated.** Calculating a price needs three facts together: the
metal, the weight, and that metal's rate for the day. Missing any one, the
article falls back to Shopify's own price field and renders without a
breakdown, rather than being priced against a number nobody published.

### Shopify's price field, and what checkout charges

The storefront quotes the calculated price. **Shopify's checkout charges the
variant's price field** — that is the one thing on this site the storefront
does not control. The two must therefore be kept in step: when the rate moves,
the prices in Shopify have to move with it, or a buyer will be charged
something other than the figure they were shown.

The code does not hide the gap. `getProductMetrics` returns `shopifyPrice`
alongside the calculated one and `priceMatchesShopify`, which is `true`,
`false`, or `null` when there is nothing to compare — enough to build a
mismatch warning or an admin report on. `cartTotals` reports the same thing
for a whole bag through `allCalculated`.

The bag is priced by the same formula as the product page
([app/lib/cart-totals.js](app/lib/cart-totals.js)), line by line, so the two
can never quote different figures for the same article.

### Metal rates

Rates are per metal, per day, and the shop publishes them itself — as **shop**
metafields in the same `sha` namespace, under Settings → Custom data → Shop.
[app/lib/metal-rates.server.js](app/lib/metal-rates.server.js) reads them:

| Shop metafield (`sha`) | Type | Example |
| --- | --- | --- |
| `metal_rates` | json | `{"silver": {"our": 91.70, "market": 94.20}, "gold": {"our": 7250, "market": 7310}}` |
| `rate_silver`, `rate_gold` | decimal | `91.70` — one key per metal, instead of the json table |
| `market_silver`, `market_gold` | decimal | `94.20` — the published rate, for the comparison |
| `rate_updated_at` | single line | `9:00 AM` |
| `rate_currency` | single line | `INR` |

The json field is the one that scales: a metal the shop starts selling appears
by adding a key, with no code change. A bare number (`{"brass": 0.85}`) is
accepted as our rate with no market comparison. Where both are set for the
same metal, the per-metal key wins.

Rates are resolved on the server and cached ten minutes, so a morning revision
reaches the storefront the same morning without a deploy, and the rate strip,
tiles, product page and bag can never quote different figures.

The same applies to the delivery promise
([app/lib/delivery.js](app/lib/delivery.js)) and the pincode → city lookup
([app/lib/pincode.js](app/lib/pincode.js)), which ships with a small table and
falls back to editable city/state fields for unknown pincodes. Each carries a
`TODO(integration)` naming what should replace it.

### Currency

Money is formatted with the currency code the Storefront API actually returns,
using the design's spacing and Indian digit grouping — `₹ 24,900` from an INR
store, `$ 24,900` from a USD one. The storefront never claims rupees for
prices that are not.

## Filters are URL state

Every filter chip, the sort control and the pagination cursor live in the
query string ([app/lib/collection-filters.js](app/lib/collection-filters.js)),
so a filtered listing is linkable and survives a reload. Price and weight
bands are evaluated against resolved numbers rather than Storefront facets,
because weight is a metafield rather than a native Shopify filter. Filters
therefore apply to the pages loaded so far; the count says so explicitly
rather than implying a total it has not verified.

The category nav is not a list in the source: it is whatever collections exist
in Shopify. The root loader resolves them once
([app/lib/collections.js](app/lib/collections.js)), and the header, the mobile
menu, the footer, the home strip and the search page all read that one list —
add a collection in the admin and it appears in every one of them.

A listing shows exactly what Shopify has in that collection. There is no fall
back to the full catalogue: a product appears on a category page only if it
was put in that collection, and a handle the store does not have is a 404.

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
  shipping and total all render, each priced by the formula.
- `POST /checkout` with a 4-digit pincode → renders "Pincode must be 6 digits".
- `POST /checkout` with valid details → `302` to a live Shopify checkout URL,
  with the buyer-identity update succeeding (no fallback logged).
