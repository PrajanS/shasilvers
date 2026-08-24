import {useRouteLoaderData} from 'react-router';

/**
 * Every collection the store publishes.
 *
 * Resolved once in the root loader and read from there by the header, the
 * mobile menu, the footer, the home strip and the search page, so no two
 * places can disagree about what the shop sells. Add a collection in Shopify
 * and it appears in all of them; there is no list to keep in step here.
 *
 * @returns {Array<{id: string, handle: string, title: string, image?: any}>}
 */
export function useCollections() {
  const data = useRouteLoaderData('root');
  return data?.collections ?? [];
}

/**
 * A link to the first of `preferred` handles the store actually has.
 *
 * Editorial links in the source — the hero buttons, "Bulk orders" in the
 * footer — name the collection they mean. The shop owns those handles, and can
 * rename or drop one at any time, so the link resolves against the live list
 * and falls back to the full collection index rather than dead-ending.
 *
 * @param {Array<{handle: string}>} collections
 * @param {...string} preferred Handles to try, best first.
 * @returns {string}
 */
export function collectionPath(collections, ...preferred) {
  const available = new Set((collections ?? []).map((c) => c.handle));
  const match = preferred.find((handle) => available.has(handle));
  return match ? `/collections/${match}` : '/collections';
}

/**
 * `collectionPath` against the collections the root loader resolved.
 * @param {...string} preferred
 */
export function useCollectionPath(...preferred) {
  return collectionPath(useCollections(), ...preferred);
}
