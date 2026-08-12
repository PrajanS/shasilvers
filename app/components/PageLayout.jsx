import {Suspense} from 'react';
import {Await} from 'react-router';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {RateStrip} from '~/components/RateStrip';

/**
 * The chrome every page shares: rate bar, header with search and category nav,
 * the page itself, then the footer. The bag is a drawer that slides in from
 * the right rather than a route, so adding never costs the buyer their place.
 *
 * @param {{
 *   cart: Promise<any>,
 *   children?: React.ReactNode,
 *   rate: {ratePerGram: number, updatedAt: string, currencyCode: string},
 * }} props
 */
export function PageLayout({cart, children = null, rate, demo = false}) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <MobileMenuAside />

      {/* First stop in the tab order on every page. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <RateStrip rate={rate} />
      <Header cart={cart} />

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <Footer demo={demo} />
    </Aside.Provider>
  );
}

/** @param {{cart: Promise<any>}} props */
function CartAside({cart}) {
  return (
    <Aside
      type="cart"
      heading={
        <Suspense fallback="Your bag">
          <Await resolve={cart} errorElement="Your bag">
            {(resolved) => {
              const count = resolved?.totalQuantity ?? 0;
              return count
                ? `Your bag · ${count} item${count === 1 ? '' : 's'}`
                : 'Your bag';
            }}
          </Await>
        </Suspense>
      }
    >
      <Suspense fallback={<p className="cart-empty">Loading bag…</p>}>
        <Await resolve={cart}>
          {(resolved) => <CartMain cart={resolved} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function MobileMenuAside() {
  return (
    <Aside type="mobile" heading="Menu">
      <HeaderMenu />
    </Aside>
  );
}
