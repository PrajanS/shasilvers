import {useLoaderData, Link} from 'react-router';
import {Breadcrumbs} from '~/components/Breadcrumbs';

/** @type {Route.MetaFunction} */
export const meta = () => {
  return [{title: 'Policies — Sha Silvers'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const data = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy) => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  /** @type {LoaderReturnData} */
  const {policies} = useLoaderData();

  return (
    <div className="editorial">
      <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: 'Policies'}]} />
      <h1 className="t-display-l editorial__title">Policies</h1>
      <nav className="policy-list" aria-label="Shop policies">
        {policies.map((policy) => (
          <Link
            className="policy-list__item"
            key={policy.id}
            to={`/policies/${policy.handle}`}
          >
            {policy.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`;

/** @typedef {import('./+types/policies._index').Route} Route */
/** @typedef {import('storefrontapi.generated').PoliciesQuery} PoliciesQuery */
/** @typedef {import('storefrontapi.generated').PolicyItemFragment} PolicyItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
