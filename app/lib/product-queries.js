/**
 * Product GraphQL for every screen that renders tiles.
 *
 * An article carries three facts Shopify has no native field for: the metal,
 * its nett weight and the making charge. Together they are the price. They are
 * requested alongside the product wherever a tile or a spec table is rendered.
 *
 * Both the default `custom` namespace and `sha` are asked for, under either
 * spelling of each key, so the definitions work however they were named in the
 * admin. See `~/lib/pricing` for which spelling wins.
 *
 * The fragment and the documents that use it live in the same module on
 * purpose. Hydrogen's codegen validates each file's GraphQL statically and
 * cannot follow a fragment across an import, so a document defined elsewhere
 * would fail the build with "Unknown fragment".
 */

export const PRODUCT_TILE_FRAGMENT = `#graphql
  fragment ProductTile on Product {
    id
    handle
    title
    productType
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    selectedOrFirstAvailableVariant(ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      id
      availableForSale
      price {
        amount
        currencyCode
      }
      metafields(identifiers: [
        {namespace: "custom", key: "metal_name"},
        {namespace: "custom", key: "metal_weight"},
        {namespace: "custom", key: "making_charge"},
        {namespace: "custom", key: "metal"},
        {namespace: "custom", key: "nett_weight_g"},
        {namespace: "sha", key: "metal"},
        {namespace: "sha", key: "nett_weight_g"},
        {namespace: "sha", key: "making_charge"}
      ]) {
        key
        value
      }
    }
    metafields(identifiers: [
      {namespace: "custom", key: "metal_name"},
      {namespace: "custom", key: "metal_weight"},
      {namespace: "custom", key: "making_charge"},
      {namespace: "custom", key: "metal"},
      {namespace: "custom", key: "nett_weight_g"},
      {namespace: "sha", key: "metal"},
      {namespace: "sha", key: "nett_weight_g"},
      {namespace: "sha", key: "making_charge"}
    ]) {
      key
      value
    }
  }
`;

/** Home — the first row of buyable product. */
export const FEATURED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_TILE_FRAGMENT}
  query FeaturedProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        ...ProductTile
      }
    }
  }
`;

/** Category listing. */
export const COLLECTION_QUERY = `#graphql
  ${PRODUCT_TILE_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductTile
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/**
 * Fallback for a category whose collection does not exist in the store yet.
 * Note the sort enum differs from the collection query: products use
 * `CREATED_AT` where a collection uses `CREATED`.
 */
export const ALL_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_TILE_FRAGMENT}
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: $sortKey,
      reverse: $reverse
    ) {
      nodes {
        ...ProductTile
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
`;

/** Free-text search across the catalogue. */
export const SEARCH_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_TILE_FRAGMENT}
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        ...ProductTile
      }
    }
  }
`;

/**
 * Neighbours from the product's own collection. `productRecommendations` is
 * not available on every storefront, so this walks the collection instead —
 * and the caller tolerates an empty result.
 */
export const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_TILE_FRAGMENT}
  query RecommendedProducts(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      collections(first: 1) {
        nodes {
          products(first: 5) {
            nodes {
              ...ProductTile
            }
          }
        }
      }
    }
  }
`;

/**
 * Every published collection, for the nav, the footer and the home strip.
 *
 * The storefront has no hardcoded category list: what the shop sells is
 * whatever collections exist in Shopify. Sorted by title so the order is
 * stable between requests, and cached long — collections change rarely.
 */
export const COLLECTIONS_QUERY = `#graphql
  query NavCollections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        image {
          id
          altText
          url
          width
          height
        }
      }
    }
  }
`;
