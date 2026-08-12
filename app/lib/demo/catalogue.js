/**
 * Demo catalogue — real Sha Silvers articles.
 *
 * WHY THIS EXISTS
 * Hydrogen falls back to Shopify's public mock.shop sandbox when no store is
 * connected, and mock.shop serves apparel. You cannot judge a silverware grid
 * against a hoodie: the weight, making-charge and delivery lines carry no
 * meaning, the 1:1 crop is wrong, and the category nav lands on t-shirts.
 *
 * So this module supplies the catalogue instead — eighteen articles across all
 * eight categories, priced in rupees, with the nett weights, making charges
 * and hallmark IDs the design is built around.
 *
 * IT IS ONLY EVER USED WHEN NO REAL STORE IS CONNECTED (see `~/lib/demo/mode`).
 * Connect a storefront and every loader goes to the Storefront API instead;
 * nothing here runs. To remove it entirely: delete `app/lib/demo/`, then drop
 * the `isDemoMode` branches in the loaders — each is marked `DEMO`.
 *
 * Prices are derived, not invented: `price = round((weight × rate + making) ×
 * 1.03)`. The breakdown on the product page therefore reconciles exactly,
 * which is the point — you are reviewing real arithmetic, not lorem ipsum.
 */

import {GST_RATE, OUR_RATE} from '~/lib/shop';

/**
 * Demo prices are struck at Sha Silvers' own rate, not the market rate, so
 * the breakdown on the product page reconciles against the same figure the
 * rate strip shows as ours.
 */
const RATE = OUR_RATE;

/**
 * @param {number} weight grams
 * @param {number} making making charge in rupees
 */
function price(weight, making) {
  return Math.round((weight * RATE + making) * (1 + GST_RATE));
}

/**
 * Article definitions. `sizes` produces one variant per entry; articles
 * without `sizes` are single-variant.
 */
const ARTICLES = [
  // --- Pooja articles ------------------------------------------------------
  {
    handle: 'kanchi-pooja-thali',
    title: 'Kanchi pooja thali',
    category: 'pooja-articles',
    productType: 'Thali & plates',
    articleCode: 'SHA-PT-0912',
    huid: '4A29KQ',
    dimensions: '228 mm dia · 18 mm rim',
    finishNote: 'Hand-raised, mirror polished',
    description:
      'Raised from a single sheet and spun on the lathe in our Coimbatore workshop. The rim is rolled by hand, which is why no two catch the light identically.',
    sizes: [
      {name: '7 in', weight: 142, making: 1420},
      {name: '9 in', weight: 218, making: 2180},
      {name: '11 in', weight: 305, making: 3050},
    ],
    finishes: ['Mirror', 'Matte', 'Antique'],
  },
  {
    handle: 'deepam-diya-pair',
    title: 'Deepam diya, pair',
    category: 'pooja-articles',
    productType: 'Diya & lamps',
    articleCode: 'SHA-DP-0221',
    huid: '7B14LM',
    dimensions: '62 mm dia · 34 mm tall',
    weight: 74,
    making: 890,
  },
  {
    handle: 'kumkum-bharani',
    title: 'Kumkum bharani',
    category: 'pooja-articles',
    productType: 'Kumkum & bharani',
    articleCode: 'SHA-KB-0107',
    huid: '3C88PT',
    dimensions: '48 mm dia · 52 mm tall',
    weight: 58,
    making: 720,
  },
  {
    handle: 'pooja-bell',
    title: 'Pooja bell, temple pattern',
    category: 'pooja-articles',
    productType: 'Bells & accessories',
    articleCode: 'SHA-PB-0044',
    huid: '9D02RS',
    dimensions: '46 mm dia · 96 mm tall',
    weight: 52,
    making: 640,
  },
  {
    handle: 'panchapatra-uddharani',
    title: 'Panchapatra & uddharani set',
    category: 'pooja-articles',
    productType: 'Thali & plates',
    articleCode: 'SHA-PU-0310',
    huid: '5E71VN',
    weight: 132,
    making: 1490,
  },

  // --- Dining & thali ------------------------------------------------------
  {
    handle: 'dinner-plate',
    title: 'Dinner plate',
    category: 'dining-thali',
    productType: 'Thali & plates',
    articleCode: 'SHA-DN-1004',
    huid: '2F63WK',
    dimensions: '254 mm dia',
    description:
      'A everyday plate with weight enough to sit still on the table. Rim polished to a mirror, well left matte so cutlery does not read every mark.',
    sizes: [
      {name: '10 in', weight: 310, making: 3100},
      {name: '12 in', weight: 402, making: 4020},
    ],
  },
  {
    handle: 'serving-bowl',
    title: 'Serving bowl, medium',
    category: 'dining-thali',
    productType: 'Thali & plates',
    articleCode: 'SHA-SB-0512',
    huid: '8G45XA',
    weight: 165,
    making: 1780,
  },

  // --- Spoons & cutlery ----------------------------------------------------
  {
    handle: 'serving-spoon-set-6',
    title: 'Serving spoon, set of 6',
    category: 'spoons-cutlery',
    productType: 'Bells & accessories',
    articleCode: 'SHA-SS-0606',
    huid: '4H90YB',
    weight: 96,
    making: 1240,
  },
  {
    handle: 'dessert-spoon-set-4',
    title: 'Dessert spoon, set of 4',
    category: 'spoons-cutlery',
    productType: 'Bells & accessories',
    articleCode: 'SHA-DS-0404',
    huid: '6J21ZC',
    weight: 62,
    making: 810,
  },

  // --- Tumblers & drinkware ------------------------------------------------
  {
    handle: 'tumbler-lota-set',
    title: 'Tumbler & lota set',
    category: 'tumblers-drinkware',
    productType: 'Thali & plates',
    articleCode: 'SHA-TL-0208',
    huid: '1K37AD',
    weight: 210,
    making: 2260,
  },
  {
    handle: 'water-tumbler',
    title: 'Water tumbler, plain',
    category: 'tumblers-drinkware',
    productType: 'Thali & plates',
    articleCode: 'SHA-WT-0096',
    huid: '7L58BE',
    weight: 96,
    making: 1050,
  },
  {
    handle: 'baby-feeding-tumbler',
    title: 'Baby feeding tumbler',
    category: 'tumblers-drinkware',
    productType: 'Bells & accessories',
    articleCode: 'SHA-BF-0048',
    huid: '3M09CF',
    weight: 48,
    making: 690,
    availableForSale: false,
  },

  // --- Idols ---------------------------------------------------------------
  {
    handle: 'ganesha-idol-3in',
    title: 'Ganesha idol, 3 inch',
    category: 'idols',
    productType: 'Bells & accessories',
    articleCode: 'SHA-GI-0303',
    huid: '5N44DG',
    dimensions: '76 mm tall · 58 mm base',
    weight: 145,
    making: 2900,
  },
  {
    handle: 'lakshmi-idol-4in',
    title: 'Lakshmi idol, 4 inch',
    category: 'idols',
    productType: 'Bells & accessories',
    articleCode: 'SHA-LI-0404',
    huid: '9P16EH',
    dimensions: '102 mm tall · 64 mm base',
    weight: 198,
    making: 3960,
    availableForSale: false,
  },

  // --- Gifting -------------------------------------------------------------
  {
    handle: 'gift-set-thali-diya',
    title: 'Gift set — thali & diya pair',
    category: 'gifting',
    productType: 'Thali & plates',
    articleCode: 'SHA-GS-0292',
    huid: '2Q73FJ',
    description:
      'The 9 inch thali with a pair of deepam diyas, boxed in mango wood with a hand-written card. The usual wedding and housewarming order.',
    weight: 292,
    making: 3200,
  },
  {
    handle: 'silver-coin-10g',
    title: 'Silver coin, 10 g, Lakshmi',
    category: 'gifting',
    productType: 'Bells & accessories',
    articleCode: 'SHA-SC-0010',
    huid: '8R25GK',
    weight: 10,
    making: 180,
  },

  // --- Bulk & corporate ----------------------------------------------------
  {
    handle: 'corporate-coin-5g',
    title: 'Corporate coin, 5 g — 25 piece minimum',
    category: 'bulk-corporate',
    productType: 'Bells & accessories',
    articleCode: 'SHA-CC-0005',
    huid: '4S81HL',
    description:
      'Struck with your logo on the reverse. Minimum order 25 pieces, GST invoice, dispatched in 10 working days.',
    weight: 5,
    making: 90,
  },

  // --- Jewellery (one occasional category, not the shop) -------------------
  {
    handle: 'toe-ring-pair',
    title: 'Toe ring, pair',
    category: 'jewellery',
    productType: 'Bells & accessories',
    articleCode: 'SHA-TR-0012',
    huid: '6T92JM',
    weight: 12,
    making: 340,
  },
];

/** @param {string} value */
function money(value) {
  return {amount: value.toFixed(2), currencyCode: 'INR'};
}

/**
 * @param {object} article
 * @param {{name: string, weight: number, making: number}} size
 * @param {string|null} finish
 */
function buildVariant(article, size, finish) {
  const parts = [size?.name, finish].filter(Boolean);
  const suffix = parts.length ? `-${parts.join('-').toLowerCase().replace(/\s+/g, '')}` : '';
  const weight = size?.weight ?? article.weight;
  const making = size?.making ?? article.making;

  /** @type {Array<{name: string, value: string}>} */
  const selectedOptions = [];
  if (size?.name) selectedOptions.push({name: 'Size', value: size.name});
  if (finish) selectedOptions.push({name: 'Finish', value: finish});
  if (!selectedOptions.length) {
    selectedOptions.push({name: 'Title', value: 'Default Title'});
  }

  return {
    id: `demo://ProductVariant/${article.handle}${suffix}`,
    title: parts.join(' / ') || 'Default Title',
    sku: `${article.articleCode}${suffix.toUpperCase()}`,
    availableForSale: article.availableForSale !== false,
    image: null,
    price: money(price(weight, making)),
    compareAtPrice: null,
    weight,
    weightUnit: 'GRAMS',
    selectedOptions,
    product: {handle: article.handle, title: article.title},
    metafields: [
      {key: 'nett_weight_g', value: String(weight)},
      {key: 'making_charge', value: String(making)},
    ],
  };
}

/** @param {object} article */
function buildProduct(article) {
  const sizes = article.sizes ?? [null];
  const finishes = article.finishes ?? [null];

  /** @type {any[]} */
  const variants = [];
  for (const size of sizes) {
    for (const finish of finishes) {
      variants.push(buildVariant(article, size, finish));
    }
  }

  const prices = variants.map((v) => Number(v.price.amount));

  return {
    id: `demo://Product/${article.handle}`,
    handle: article.handle,
    title: article.title,
    vendor: 'Sha Silvers',
    productType: article.productType,
    availableForSale: article.availableForSale !== false,
    description: article.description ?? '',
    descriptionHtml: article.description ? `<p>${article.description}</p>` : '',
    featuredImage: null,
    images: {nodes: []},
    priceRange: {
      minVariantPrice: money(Math.min(...prices)),
      maxVariantPrice: money(Math.max(...prices)),
    },
    variants,
    // Category is demo-only routing metadata, not a Storefront field.
    category: article.category,
    metafields: [
      {key: 'nett_weight_g', value: String(article.sizes ? article.sizes[0].weight : article.weight)},
      {key: 'making_charge', value: String(article.sizes ? article.sizes[0].making : article.making)},
      {key: 'weight_tolerance_g', value: '3'},
      {key: 'purity', value: '925 sterling silver'},
      {key: 'huid', value: article.huid},
      article.dimensions ? {key: 'dimensions', value: article.dimensions} : null,
      article.finishNote ? {key: 'finish_note', value: article.finishNote} : null,
      {key: 'made_at', value: 'Sha Silvers workshop, Coimbatore'},
      {key: 'article_code', value: article.articleCode},
    ].filter(Boolean),
  };
}

const PRODUCTS = ARTICLES.map(buildProduct);

/** Every demo article. */
export function getDemoProducts() {
  return PRODUCTS;
}

/** @param {string} handle */
export function getDemoProduct(handle) {
  return PRODUCTS.find((product) => product.handle === handle) ?? null;
}

/** @param {string} variantId */
export function getDemoVariant(variantId) {
  for (const product of PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return {product, variant};
  }
  return null;
}

/**
 * The shape a product tile expects — the demo product minus its variant list,
 * with one variant promoted to `selectedOrFirstAvailableVariant`.
 * @param {any} product
 * @param {Record<string, string>} [selectedOptions]
 */
export function toTile(product, selectedOptions) {
  return {
    ...product,
    selectedOrFirstAvailableVariant: selectVariant(product, selectedOptions),
  };
}

/**
 * Pick the variant matching the chosen options, falling back to the first
 * available one — the same rule the Storefront API applies.
 * @param {any} product
 * @param {Record<string, string>} [selectedOptions]
 */
export function selectVariant(product, selectedOptions) {
  if (selectedOptions && Object.keys(selectedOptions).length) {
    const match = product.variants.find((variant) =>
      variant.selectedOptions.every(
        (option) =>
          selectedOptions[option.name] === undefined ||
          selectedOptions[option.name] === option.value,
      ),
    );
    if (match) return match;
  }
  return product.variants.find((v) => v.availableForSale) ?? product.variants[0];
}

/**
 * The product's options in the Storefront API's own shape
 * (`options[].optionValues[]`). Hydrogen's variant helpers inspect this field
 * even when we build the chips ourselves, and warn if it is absent.
 * @param {any} product
 */
export function getDemoOptionsField(product) {
  /** @type {Map<string, Set<string>>} */
  const options = new Map();
  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      // `Title / Default Title` is kept here on purpose: it is what the
      // Storefront API returns for a product with no real options, and
      // Hydrogen's variant helpers warn when `options` comes back empty.
      // The chip builder below drops it so no pointless chip is rendered.
      if (!options.has(option.name)) options.set(option.name, new Set());
      options.get(option.name).add(option.value);
    }
  }
  return [...options.entries()].map(([name, values]) => ({
    name,
    optionValues: [...values].map((value) => ({name: value})),
  }));
}

/**
 * Build the option list in the shape `getProductOptions` returns, so the
 * product page renders chips identically in both modes.
 * @param {any} product
 * @param {any} selectedVariant
 */
export function getDemoProductOptions(product, selectedVariant) {
  /** @type {Map<string, Set<string>>} */
  const options = new Map();
  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      if (option.value === 'Default Title') continue;
      if (!options.has(option.name)) options.set(option.name, new Set());
      options.get(option.name).add(option.value);
    }
  }

  const selected = Object.fromEntries(
    (selectedVariant?.selectedOptions ?? []).map((o) => [o.name, o.value]),
  );

  return [...options.entries()].map(([name, values]) => ({
    name,
    optionValues: [...values].map((value) => {
      // A value exists if some variant combines it with the other current
      // selections; it is available if that variant is in stock.
      const candidate = product.variants.find((variant) =>
        variant.selectedOptions.every((option) =>
          option.name === name
            ? option.value === value
            : selected[option.name] === undefined ||
              selected[option.name] === option.value,
        ),
      );

      const query = new URLSearchParams({...selected, [name]: value});

      return {
        name: value,
        handle: product.handle,
        variantUriQuery: query.toString(),
        selected: selected[name] === value,
        available: Boolean(candidate?.availableForSale),
        exists: Boolean(candidate),
        isDifferentProduct: false,
        swatch: null,
      };
    }),
  }));
}

/**
 * Filter, sort and page the demo catalogue the way the Storefront API would.
 * @param {object} args
 * @param {string} [args.category]
 * @param {string} [args.query] free-text search
 * @param {string} [args.sortKey]
 * @param {boolean} [args.reverse]
 * @param {number} [args.first]
 * @param {string|null} [args.after] index cursor
 */
export function queryDemoProducts({
  category,
  query,
  sortKey = 'PRICE',
  reverse = false,
  first = 24,
  after = null,
} = {}) {
  let nodes = PRODUCTS.slice();

  if (category) nodes = nodes.filter((p) => p.category === category);

  if (query) {
    const needle = query.toLowerCase();
    nodes = nodes.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.productType.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }

  const priceOf = (p) => Number(p.priceRange.minVariantPrice.amount);
  if (sortKey === 'PRICE') nodes.sort((a, b) => priceOf(a) - priceOf(b));
  else if (sortKey === 'TITLE') nodes.sort((a, b) => a.title.localeCompare(b.title));
  // CREATED / CREATED_AT / BEST_SELLING keep the authored order.
  if (reverse) nodes.reverse();

  const start = after ? Number(after) || 0 : 0;
  const page = nodes.slice(start, start + first);
  const end = start + page.length;

  return {
    nodes: page.map((product) => toTile(product)),
    pageInfo: {
      hasNextPage: end < nodes.length,
      hasPreviousPage: start > 0,
      startCursor: String(start),
      endCursor: String(end),
    },
  };
}
