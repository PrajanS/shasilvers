import {useLoaderData} from 'react-router';
import {Breadcrumbs} from '~/components/Breadcrumbs';

/**
 * One shop policy — refund, shipping, terms or privacy.
 *
 * The body is HTML written in the Shopify admin, so it arrives as arbitrary
 * markup rather than components. `.prose` is the one place in the stylesheet
 * that styles bare tags, for exactly this reason.
 *
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `${data?.policy.title ?? 'Policy'} — Sha Silvers`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(/-([a-z])/g, (_, m1) =>
    m1.toUpperCase(),
  );

  // The handle chooses which `@include` flag is set, so a handle that is not
  // one of the four would set no flag and select nothing. Reject it here
  // rather than sending a query that cannot answer.
  const KNOWN = [
    'privacyPolicy',
    'shippingPolicy',
    'termsOfService',
    'refundPolicy',
  ];
  if (!KNOWN.includes(policyName)) {
    throw new Response('Could not find the policy', {status: 404});
  }

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  /** @type {LoaderReturnData} */
  const {policy} = useLoaderData();

  return (
    <article className="editorial">
      <Breadcrumbs
        trail={[
          {label: 'Home', to: '/'},
          {label: 'Policies', to: '/policies'},
          {label: policy.title},
        ]}
      />
      <h1 className="t-display-l editorial__title">{policy.title}</h1>
      <div
        className="prose"
        dangerouslySetInnerHTML={{__html: policy.body}}
      />
    </article>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
`;

/**
 * @typedef {keyof Pick<
 *   Shop,
 *   'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
 * >} SelectedPolicies
 */

/** @typedef {import('./+types/policies.$handle').Route} Route */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Shop} Shop */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
