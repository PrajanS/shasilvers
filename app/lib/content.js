/**
 * Pages and policies the shop actually publishes.
 *
 * The same rule the collections follow: the storefront does not decide what
 * content exists, Shopify does. Editorial links in the source name the page
 * they mean, and this resolves that name against the live list — so a link to
 * a page the shop has not written yet is dropped from the nav rather than
 * rendered as a 404 waiting to happen.
 *
 * Policies are separate from pages in Shopify: a policy is one of a fixed set
 * (refund, shipping, terms, privacy…) edited under Settings → Policies, while
 * a page is free-form content. They are queried together and kept apart here
 * because their URLs differ (`/policies/:handle` vs `/pages/:handle`).
 */

import {useRouteLoaderData} from 'react-router';

/**
 * Pages and the policies that have been written, for the footer and anywhere
 * else that links to editorial content.
 *
 * Asks for the policies by name because `Shop.shopPolicies` does not exist —
 * each is its own nullable field, and a policy the shop has not written comes
 * back null.
 */
export const SHOP_CONTENT_QUERY = `#graphql
  query ShopContent($country: CountryCode, $language: LanguageCode, $first: Int)
  @inContext(country: $country, language: $language) {
    pages(first: $first) {
      nodes {
        id
        handle
        title
      }
    }
    shop {
      refundPolicy { id handle title }
      shippingPolicy { id handle title }
      termsOfService { id handle title }
      privacyPolicy { id handle title }
      subscriptionPolicy { id handle title }
    }
  }
`;

/**
 * Flatten the query into the two lists the app reads.
 *
 * Never throws and never returns undefined: a storefront that cannot answer
 * degrades to a footer with fewer links, not a 500.
 *
 * @param {any} data Result of `SHOP_CONTENT_QUERY`, or null.
 * @returns {{pages: Array<{handle: string, title: string}>, policies: Array<{handle: string, title: string}>}}
 */
export function parseShopContent(data) {
  const pages = (data?.pages?.nodes ?? []).filter(Boolean).map((p) => ({
    handle: p.handle,
    title: p.title,
  }));

  const shop = data?.shop ?? {};
  const policies = [
    shop.refundPolicy,
    shop.shippingPolicy,
    shop.termsOfService,
    shop.privacyPolicy,
    shop.subscriptionPolicy,
  ]
    .filter(Boolean)
    .map((p) => ({handle: p.handle, title: p.title}));

  return {pages, policies};
}

/** @returns {{pages: Array<{handle: string, title: string}>, policies: Array<{handle: string, title: string}>}} */
export function useShopContent() {
  const data = useRouteLoaderData('root');
  return data?.content ?? {pages: [], policies: []};
}

/**
 * Keep only the links whose target the shop actually publishes.
 *
 * A link with no `to` — one built from a collection path, say — is always
 * kept; this only filters `/pages/*` and `/policies/*`.
 *
 * @param {Array<{label: string, to: string}>} links
 * @param {{pages: Array<{handle: string}>, policies: Array<{handle: string}>}} content
 * @returns {Array<{label: string, to: string}>}
 */
export function keepPublished(links, content) {
  const pages = new Set((content?.pages ?? []).map((p) => p.handle));
  const policies = new Set((content?.policies ?? []).map((p) => p.handle));

  return (links ?? []).filter((link) => {
    const page = link.to?.match(/^\/pages\/([^/?#]+)/);
    if (page) return pages.has(page[1]);

    const policy = link.to?.match(/^\/policies\/([^/?#]+)/);
    if (policy) return policies.has(policy[1]);

    return true;
  });
}
