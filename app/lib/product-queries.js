/**
 * Product GraphQL for every screen that renders tiles.
 *
 * Silverware carries facts Shopify has no native field for — nett weight,
 * making charge, HUID, purity. They live in the `sha` metafield namespace and
 * are requested alongside the product wherever a tile or a spec table is
 * rendered. Every one of them is optional: `~/lib/pricing` falls back to
 * deterministic values, so a store that has not filled them in still renders
 * a complete, self-consistent page.
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
        {namespace: "sha", key: "nett_weight_g"},
        {namespace: "sha", key: "making_charge"}
      ]) {
        key
        value
      }
    }
    metafields(identifiers: [
      {namespace: "sha", key: "nett_weight_g"},
      {namespace: "sha", key: "making_charge"},
      {namespace: "sha", key: "weight_tolerance_g"},
      {namespace: "sha", key: "purity"},
      {namespace: "sha", key: "huid"},
      {namespace: "sha", key: "dimensions"},
      {namespace: "sha", key: "finish_note"},
      {namespace: "sha", key: "made_at"},
      {namespace: "sha", key: "article_code"}
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
