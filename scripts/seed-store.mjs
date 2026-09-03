/**
 * Seed the linked Shopify store with everything the storefront needs to price.
 *
 * The storefront calculates every price as
 *
 *     rate for the metal × nett weight + making charge
 *
 * and takes all three facts from Shopify. A store that has none of them renders
 * ₹0 tiles and "Price on request", which is exactly the state this script
 * exists to fix. It creates, in order:
 *
 *   1. the metafield definitions (product + shop), all Storefront-readable —
 *      without `access.storefront = PUBLIC_READ` the Storefront API returns
 *      null and the site silently falls back to Shopify's price;
 *   2. the shop rate table (`custom.metal_rates`) plus the stamp fields the
 *      rate strip renders;
 *   3. the collections named by the catalogue below, if missing;
 *   4. one product per catalogue entry, with its metal/weight/making metafields
 *      and a Shopify price set to the *same* calculated figure — Shopify's
 *      price is what checkout actually charges, so the two must agree;
 *   5. collection membership, and publication to every sales channel (a product
 *      that is not published is invisible to the Storefront API).
 *
 * Idempotent: run it as often as you like. Products are matched by handle and
 * updated in place, definitions that already exist are left alone.
 *
 * Usage:
 *   1. Shopify admin → Settings → Apps and sales channels → Develop apps →
 *      Create an app → Configure Admin API scopes. Tick:
 *        write_products, read_products,
 *        write_metaobject_definitions (for the definitions),
 *        write_publications, read_publications
 *   2. Install the app, reveal the Admin API access token (`shpat_…`).
 *   3. Put it in .env as SHOPIFY_ADMIN_API_TOKEN=shpat_…
 *   4. npm run seed          (add -- --dry to preview without writing)
 */

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_VERSION = '2025-07';
const DRY = process.argv.includes('--dry');

/* ------------------------------------------------------------------ rates */

/**
 * Today's rates, per gram. `our` is what Sha Silvers charges for the metal;
 * `market` is the published bullion rate, and the difference is the saving the
 * storefront demonstrates. Revise these here and re-run, or edit the metafield
 * in the Shopify admin — the admin is the source of truth once seeded.
 */
const RATES = {
  silver: {our: 91.7, market: 94.2},
  gold: {our: 7250, market: 7310},
};

const RATE_UPDATED_AT = '9:00 AM';
const RATE_CURRENCY = 'INR';

/* -------------------------------------------------------------- catalogue */

/**
 * The catalogue. `weight` is the nett weight in grams and `making` the making
 * charge in rupees; the price is derived from them and the rate above, never
 * written by hand. Add rows freely — nothing else in the script is per-product.
 */
const CATALOGUE = [
  {
    handle: 'pooja-thali-set-five-piece',
    title: 'Pooja thali set, five piece',
    type: 'Thali & plates',
    metal: 'silver',
    weight: 480,
    making: 9500,
    collections: ['pooja-articles', 'dining-and-thali', 'gifting'],
    description:
      'Thali, kumkum and chandan bowls, bell and deepam. Spun and finished in our own workshop, hallmarked 925.',
  },
  {
    handle: 'kuber-deepam-pair',
    title: 'Kuber deepam, pair',
    type: 'Pooja articles',
    metal: 'silver',
    weight: 180,
    making: 4200,
    collections: ['pooja-articles', 'gifting'],
    description:
      'A matched pair of deepam, weighted at the base so they sit steady on a stone floor.',
  },
  {
    handle: 'panchapatra-uddharini',
    title: 'Panchapatra and uddharini',
    type: 'Pooja articles',
    metal: 'silver',
    weight: 210,
    making: 4800,
    collections: ['pooja-articles'],
    description:
      'The vessel and spoon for achamanam, turned to the proportions our older customers ask for by name.',
  },
  {
    handle: 'lakshmi-idol-four-inch',
    title: 'Lakshmi idol, four inch',
    type: 'Idols',
    metal: 'silver',
    weight: 650,
    making: 16500,
    collections: ['idols', 'pooja-articles', 'gifting'],
    description:
      'Cast solid, hand-chased at the crown and the lotus. Four inches from base to crown.',
  },
  {
    handle: 'ganesha-idol-three-inch',
    title: 'Ganesha idol, three inch',
    type: 'Idols',
    metal: 'silver',
    weight: 420,
    making: 11000,
    collections: ['idols', 'gifting'],
    description:
      'A seated Ganesha, chased by hand. Sits well on a car dashboard or a home altar.',
  },
  {
    handle: 'thali-plate-ten-inch',
    title: 'Thali plate, ten inch',
    type: 'Thali & plates',
    metal: 'silver',
    weight: 520,
    making: 8800,
    collections: ['dining-and-thali'],
    description:
      'A plain rolled-rim thali, ten inches across. The everyday plate, not the ceremonial one.',
  },
  {
    handle: 'dinner-spoon-set-of-six',
    title: 'Dinner spoons, set of six',
    type: 'Spoons & cutlery',
    metal: 'silver',
    weight: 240,
    making: 5400,
    collections: ['spoons-and-cutlery', 'dining-and-thali', 'bulk-and-corporate'],
    description:
      'Six dinner spoons, hand-finished bowls. Weight is for the set, not the piece.',
  },
  {
    handle: 'serving-ladle',
    title: 'Serving ladle',
    type: 'Spoons & cutlery',
    metal: 'silver',
    weight: 130,
    making: 3200,
    collections: ['spoons-and-cutlery', 'dining-and-thali'],
    description: 'A deep serving ladle for sambar and payasam, with a drawn handle.',
  },
  {
    handle: 'tumbler-davara-set',
    title: 'Tumbler and davara set',
    type: 'Tumblers & drinkware',
    metal: 'silver',
    weight: 260,
    making: 5800,
    collections: ['tumblers-and-drinkware', 'dining-and-thali', 'gifting'],
    description:
      'The Coimbatore filter-coffee pair. Tumbler and davara, spun to sit flush.',
  },
  {
    handle: 'water-tumbler-200ml',
    title: 'Water tumbler, 200 ml',
    type: 'Tumblers & drinkware',
    metal: 'silver',
    weight: 150,
    making: 3600,
    collections: ['tumblers-and-drinkware'],
    description: 'A plain water tumbler, rolled rim, no engraving.',
  },
  {
    handle: 'gold-gift-coin-10g',
    title: 'Gold gift coin, 10 g',
    type: 'Gifting',
    metal: 'gold',
    weight: 10,
    making: 1800,
    collections: ['gifting', 'bulk-and-corporate', 'jewellery'],
    description:
      'A 10 gram 24k coin in a sealed assay card. Priced at the day’s gold rate plus making.',
  },
  {
    handle: 'silver-chain',
    title: 'Silver chain',
    type: 'Jewellery',
    metal: 'silver',
    weight: 5,
    making: 5000,
    collections: ['jewellery', 'spoons-and-cutlery'],
    description: 'A light 925 chain, 18 inches.',
  },
];

/** Collections the catalogue references, with the titles to create them under. */
const COLLECTION_TITLES = {
  'pooja-articles': 'Pooja articles',
  'dining-and-thali': 'Dining and thali',
  'spoons-and-cutlery': 'Spoons and cutlery',
  'tumblers-and-drinkware': 'Tumblers and drinkware',
  idols: 'Idols',
  gifting: 'Gifting',
  jewellery: 'Jewellery',
  'bulk-and-corporate': 'Bulk and corporate',
};

/* ------------------------------------------------------------ definitions */

const PRODUCT_DEFINITIONS = [
  {
    name: 'Metal name',
    namespace: 'custom',
    key: 'metal_name',
    type: 'single_line_text_field',
    description: 'The metal this article is made of, e.g. silver or gold.',
  },
  {
    name: 'Metal weight',
    namespace: 'custom',
    key: 'metal_weight',
    type: 'number_decimal',
    description: 'Nett weight in grams. The storefront multiplies this by the rate.',
  },
  {
    name: 'Making charge',
    namespace: 'custom',
    key: 'making_charge',
    type: 'number_decimal',
    description: 'Making charge in rupees, added on top of the metal value.',
  },
];

const SHOP_DEFINITIONS = [
  {
    name: 'Metal rates',
    namespace: 'custom',
    key: 'metal_rates',
    type: 'json',
    description:
      'Per-gram rates: {"silver": {"our": 91.7, "market": 94.2}, …}. Add a key to price a new metal.',
  },
  {
    name: 'Rate updated at',
    namespace: 'custom',
    key: 'rate_updated_at',
    type: 'single_line_text_field',
    description: 'When today’s rates were struck, as shown in the rate strip.',
  },
  {
    name: 'Rate currency',
    namespace: 'custom',
    key: 'rate_currency',
    type: 'single_line_text_field',
    description: 'Currency the rates are quoted in.',
  },
];

/* ------------------------------------------------------------------ setup */

function loadEnv() {
  /** @type {Record<string, string>} */
  const env = {};
  let raw = '';
  try {
    raw = readFileSync(join(ROOT, '.env'), 'utf8');
  } catch {
    fail('.env not found. Copy .env.example and fill it in first.');
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return {...env, ...process.env};
}

/** @param {string} msg */
function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

const env = loadEnv();
const DOMAIN = env.PUBLIC_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_API_TOKEN;

if (!DOMAIN) fail('PUBLIC_STORE_DOMAIN is not set in .env.');
if (!TOKEN && !DRY) {
  fail(
    'SHOPIFY_ADMIN_API_TOKEN is not set in .env.\n\n' +
      '    Shopify admin → Settings → Apps and sales channels → Develop apps →\n' +
      '    Create an app → Admin API scopes: write_products, read_products,\n' +
      '    write_publications, read_publications → Install → reveal the token.\n\n' +
      '    Then add to .env:  SHOPIFY_ADMIN_API_TOKEN=shpat_…\n' +
      '    Preview without a token with:  npm run seed -- --dry',
  );
}

const ENDPOINT = `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

/**
 * One Admin API call. Throws on transport errors, GraphQL errors, and on any
 * `userErrors` the mutation reports — a seed that half-succeeded silently is
 * worse than one that stops.
 *
 * @param {string} query
 * @param {Record<string, any>} [variables]
 * @param {string} [label]
 */
async function admin(query, variables = {}, label = 'request') {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({query, variables}),
  });

  if (res.status === 401 || res.status === 403) {
    fail(
      `Admin API rejected the token (${res.status}) on ${label}.\n` +
        '    Check SHOPIFY_ADMIN_API_TOKEN and that the app has the scopes listed above.',
    );
  }

  if (res.status === 429) {
    await sleep(2000);
    return admin(query, variables, label);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    fail(`Admin API ${res.status} on ${label}: ${JSON.stringify(body)?.slice(0, 400)}`);
  }
  if (body.errors?.length) {
    fail(`GraphQL error on ${label}: ${body.errors.map((e) => e.message).join('; ')}`);
  }

  // Every mutation in this file returns userErrors under its own field.
  for (const value of Object.values(body.data ?? {})) {
    const errs = value?.userErrors;
    if (Array.isArray(errs) && errs.length) {
      const msg = errs
        .map((e) => `${(e.field ?? []).join('.')}: ${e.message}`)
        .join('; ');
      fail(`${label} failed: ${msg}`);
    }
  }

  return body.data;
}

/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @param {string} s */
const step = (s) => console.log(`\n  ${s}`);
/** @param {string} s */
const ok = (s) => console.log(`    ✓ ${s}`);
/** @param {string} s */
const skip = (s) => console.log(`    · ${s}`);

/* ------------------------------------------------------------------ steps */

/**
 * Create the metafield definitions, skipping any that already exist.
 * The definition is what makes the metafield Storefront-readable and gives it
 * a type; without one, values set below would be invisible to the storefront.
 *
 * @param {'PRODUCT'|'SHOP'} ownerType
 * @param {Array<{name: string, namespace: string, key: string, type: string, description: string}>} defs
 */
async function ensureDefinitions(ownerType, defs) {
  const existing = await admin(
    `query Defs($ownerType: MetafieldOwnerType!) {
       metafieldDefinitions(first: 100, ownerType: $ownerType) {
         nodes { namespace key }
       }
     }`,
    {ownerType},
    `list ${ownerType} definitions`,
  );

  const have = new Set(
    existing.metafieldDefinitions.nodes.map((n) => `${n.namespace}.${n.key}`),
  );

  for (const def of defs) {
    const id = `${def.namespace}.${def.key}`;
    if (have.has(id)) {
      skip(`${ownerType.toLowerCase()} ${id} already defined`);
      continue;
    }
    await admin(
      `mutation CreateDef($definition: MetafieldDefinitionInput!) {
         metafieldDefinitionCreate(definition: $definition) {
           createdDefinition { id }
           userErrors { field message code }
         }
       }`,
      {
        definition: {
          ...def,
          ownerType,
          access: {storefront: 'PUBLIC_READ'},
        },
      },
      `create definition ${id}`,
    );
    ok(`${ownerType.toLowerCase()} ${id} defined (Storefront-readable)`);
  }
}

/** Write the rate table and its stamp onto the shop. */
async function setShopRates() {
  const {shop} = await admin(`{ shop { id } }`, {}, 'shop id');

  await admin(
    `mutation SetShop($metafields: [MetafieldsSetInput!]!) {
       metafieldsSet(metafields: $metafields) {
         metafields { key }
         userErrors { field message code }
       }
     }`,
    {
      metafields: [
        {
          ownerId: shop.id,
          namespace: 'custom',
          key: 'metal_rates',
          type: 'json',
          value: JSON.stringify(RATES),
        },
        {
          ownerId: shop.id,
          namespace: 'custom',
          key: 'rate_updated_at',
          type: 'single_line_text_field',
          value: RATE_UPDATED_AT,
        },
        {
          ownerId: shop.id,
          namespace: 'custom',
          key: 'rate_currency',
          type: 'single_line_text_field',
          value: RATE_CURRENCY,
        },
      ],
    },
    'set shop rates',
  );

  for (const [metal, r] of Object.entries(RATES)) {
    ok(`${metal}: ours ₹${r.our}/g · market ₹${r.market}/g`);
  }
}

/**
 * Resolve every collection the catalogue mentions, creating the missing ones.
 * @returns {Promise<Record<string, string>>} handle → collection id
 */
async function ensureCollections() {
  /** @type {Record<string, string>} */
  const ids = {};

  const data = await admin(
    `{ collections(first: 100) { nodes { id handle } } }`,
    {},
    'list collections',
  );
  for (const node of data.collections.nodes) ids[node.handle] = node.id;

  for (const [handle, title] of Object.entries(COLLECTION_TITLES)) {
    if (ids[handle]) {
      skip(`${handle} exists`);
      continue;
    }
    const created = await admin(
      `mutation CreateCollection($input: CollectionInput!) {
         collectionCreate(input: $input) {
           collection { id handle }
           userErrors { field message }
         }
       }`,
      {input: {title, handle}},
      `create collection ${handle}`,
    );
    ids[handle] = created.collectionCreate.collection.id;
    ok(`${handle} created`);
  }

  return ids;
}

/** Every sales channel, so seeded products are actually visible. */
async function getPublicationIds() {
  const data = await admin(
    `{ publications(first: 25) { nodes { id name } } }`,
    {},
    'list publications',
  );
  return data.publications.nodes;
}

/**
 * The price the storefront will calculate for this article. Shopify's own price
 * is set to the same figure so checkout charges what the site quoted.
 * @param {{metal: string, weight: number, making: number}} item
 */
function calculatePrice(item) {
  const rate = RATES[item.metal]?.our;
  if (!rate) fail(`No rate defined for metal "${item.metal}" (${item.handle}).`);
  return rate * item.weight + item.making;
}

/**
 * Create or update one product, with its metafields and a matching price.
 * @param {(typeof CATALOGUE)[number]} item
 */
async function upsertProduct(item) {
  const price = calculatePrice(item);

  // `products(query: "handle:…")` rather than `productByIdentifier`: the
  // search form has been stable across many API versions, and this script is
  // run rarely enough that it should not break on a version bump.
  const found = await admin(
    `query ByHandle($query: String!) {
       products(first: 1, query: $query) {
         nodes {
           id
           handle
           variants(first: 1) { nodes { id } }
         }
       }
     }`,
    {query: `handle:'${item.handle}'`},
    `look up ${item.handle}`,
  );

  const existing = found.products.nodes.find((n) => n.handle === item.handle);

  /** @type {Record<string, any>} */
  const input = {
    title: item.title,
    handle: item.handle,
    descriptionHtml: `<p>${item.description}</p>`,
    productType: item.type,
    vendor: 'Sha Silvers',
    status: 'ACTIVE',
    productOptions: [{name: 'Title', values: [{name: 'Default Title'}]}],
    metafields: [
      {
        namespace: 'custom',
        key: 'metal_name',
        type: 'single_line_text_field',
        value: item.metal,
      },
      {
        namespace: 'custom',
        key: 'metal_weight',
        type: 'number_decimal',
        value: String(item.weight),
      },
      {
        namespace: 'custom',
        key: 'making_charge',
        type: 'number_decimal',
        value: String(item.making),
      },
    ],
    variants: [
      {
        optionValues: [{optionName: 'Title', name: 'Default Title'}],
        price: price.toFixed(2),
        // Untracked rather than stocked: these are made to order, and a tracked
        // variant at zero reads as availableForSale:false, which disables the
        // whole buy path.
        inventoryItem: {tracked: false},
        ...(existing?.variants?.nodes?.[0]?.id
          ? {id: existing.variants.nodes[0].id}
          : {}),
      },
    ],
  };

  if (existing?.id) input.id = existing.id;

  const result = await admin(
    `mutation Upsert($input: ProductSetInput!) {
       productSet(synchronous: true, input: $input) {
         product { id handle }
         userErrors { field message code }
       }
     }`,
    {input},
    `upsert ${item.handle}`,
  );

  const id = result.productSet.product.id;
  ok(
    `${item.title.padEnd(34)} ${item.metal.padEnd(6)} ${String(item.weight).padStart(4)} g  ₹${price.toLocaleString('en-IN')}`,
  );
  return id;
}

/* ------------------------------------------------------------------- main */

async function main() {
  console.log(`\n  Seeding ${DOMAIN}${DRY ? '  (dry run — nothing will be written)' : ''}`);

  if (DRY) {
    step('Would set rates');
    for (const [metal, r] of Object.entries(RATES)) {
      ok(`${metal}: ours ₹${r.our}/g · market ₹${r.market}/g`);
    }
    step(`Would upsert ${CATALOGUE.length} products`);
    for (const item of CATALOGUE) {
      const price = calculatePrice(item);
      ok(
        `${item.title.padEnd(34)} ${item.metal.padEnd(6)} ${String(item.weight).padStart(4)} g × ₹${RATES[item.metal].our} + ₹${item.making} = ₹${price.toLocaleString('en-IN')}`,
      );
    }
    console.log('\n  Dry run complete. Add SHOPIFY_ADMIN_API_TOKEN to .env and re-run.\n');
    return;
  }

  step('Metafield definitions');
  await ensureDefinitions('PRODUCT', PRODUCT_DEFINITIONS);
  await ensureDefinitions('SHOP', SHOP_DEFINITIONS);

  step('Shop metal rates');
  await setShopRates();

  step('Collections');
  const collectionIds = await ensureCollections();

  step('Sales channels');
  const publications = await getPublicationIds();
  for (const p of publications) ok(p.name);

  step(`Products (price = rate × weight + making)`);
  /** @type {Record<string, string>} */
  const productIds = {};
  for (const item of CATALOGUE) {
    productIds[item.handle] = await upsertProduct(item);
  }

  step('Publishing to sales channels');
  for (const [handle, id] of Object.entries(productIds)) {
    await admin(
      `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
         publishablePublish(id: $id, input: $input) {
           userErrors { field message }
         }
       }`,
      {id, input: publications.map((p) => ({publicationId: p.id}))},
      `publish ${handle}`,
    );
  }
  ok(`${Object.keys(productIds).length} products published to ${publications.length} channels`);

  step('Collection membership');
  /** @type {Record<string, string[]>} */
  const byCollection = {};
  for (const item of CATALOGUE) {
    for (const handle of item.collections) {
      (byCollection[handle] ??= []).push(productIds[item.handle]);
    }
  }
  for (const [handle, ids] of Object.entries(byCollection)) {
    const collectionId = collectionIds[handle];
    if (!collectionId) {
      skip(`${handle} missing, skipped`);
      continue;
    }
    await admin(
      `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
         collectionAddProducts(id: $id, productIds: $productIds) {
           userErrors { field message }
         }
       }`,
      {id: collectionId, productIds: ids},
      `add products to ${handle}`,
    );
    ok(`${handle}: ${ids.length} article${ids.length === 1 ? '' : 's'}`);
  }

  console.log(
    '\n  Done. The storefront should now show calculated prices and a rate strip.' +
      '\n  Revise rates any morning in Shopify admin → Settings → Custom data → Shop,' +
      '\n  or edit RATES here and re-run.\n',
  );
}

main().catch((e) => fail(e?.stack ?? String(e)));
