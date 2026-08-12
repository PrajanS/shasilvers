import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  Link,
} from 'react-router';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import tokenStyles from '~/styles/tokens.css?url';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from '~/components/PageLayout';
import {THEME_INIT_SCRIPT} from '~/components/ThemeToggle';
import {getSilverRate} from '~/lib/silver-rate.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {isDemoMode} from '~/lib/demo/mode';
import {getDemoCart} from '~/lib/demo/cart.server';

/**
 * Avoid re-fetching root data on sub-navigations.
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // Revalidate after any mutation — adding to the bag changes the header.
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@300;400;500;600&display=swap',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  const {storefront, env, cart, customerAccount, session} = args.context;
  const demo = isDemoMode(env);

  // The silver rate and the delivery promise are resolved once, on the server,
  // and shared by every component that prints them. That keeps the rate bar,
  // the tiles, the product page and the bag from ever quoting different
  // numbers, and keeps server and client markup identical through hydration.
  const rate = getSilverRate();
  const delivery = getDeliveryEstimate();

  return {
    // DEMO: with no store connected the bag lives in the session, because the
    // demo catalogue's variant IDs are not Shopify's. See ~/lib/demo/cart.
    cart: demo ? Promise.resolve(getDemoCart(session)) : cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    demo,
    rate,
    delivery,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  };
}

/**
 * @param {{children?: React.ReactNode}}
 */
export function Layout({children}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/*
          Stylesheets are linked here rather than via `links()` to avoid an
          HMR ordering bug in development. Tokens must load before app.css.
        */}
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={tokenStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
        {/*
          Applies the stored theme before first paint so a buyer who chose
          dark never sees a white flash. Must run inline, ahead of hydration.
        */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{__html: THEME_INIT_SCRIPT}}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
      <PageLayout cart={data.cart} rate={data.rate} demo={data.demo}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = '';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const isNotFound = errorStatus === 404;

  return (
    <div className="route-error">
      <h1>{isNotFound ? 'Not found' : 'Something went wrong'}</h1>
      <p>
        {isNotFound
          ? 'That page has moved or never existed. The catalogue is all still here.'
          : 'We could not load this page. Please try again.'}
      </p>
      <p>
        <Link className="btn btn--secondary" to="/">
          Back to the shop
        </Link>
      </p>
      {errorMessage && !isNotFound ? <pre>{errorMessage}</pre> : null}
    </div>
  );
}

/** @typedef {LoaderReturnData} RootLoader */

/** @typedef {import('react-router').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('./+types/root').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
