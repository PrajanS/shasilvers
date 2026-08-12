import {Suspense} from 'react';
import {Await, Link, NavLink, useLocation, useParams} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {BagIcon, SearchIcon} from '~/components/Icons';
import {ThemeToggle} from '~/components/ThemeToggle';
import {CATEGORIES, SHOP} from '~/lib/shop';
import {formatMoney} from '~/lib/money';

/**
 * Site header.
 *
 * Search is a primary control here, not an icon hiding a panel — it is a real
 * form, always visible, that submits to /search. The category nav sits
 * directly beneath it and is also always visible, so any category is one
 * click from any page.
 *
 * @param {{cart: Promise<any>|any}} props
 */
export function Header({cart}) {
  const {open} = useAside();
  const location = useLocation();
  const currentSearch = new URLSearchParams(location.search).get('q') ?? '';

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <button
            type="button"
            className="header-menu-toggle"
            aria-label="Open menu"
            onClick={() => open('mobile')}
          >
            <span />
            <span />
          </button>

          <Link to="/" className="wordmark" prefetch="intent">
            <span className="wordmark__name">{SHOP.name}</span>
            <span className="wordmark__sub">{SHOP.tagline}</span>
          </Link>

          <SearchField
            defaultValue={currentSearch}
            className="is-desktop-search"
          />

          <div className="header-actions">
            <NavLink to="/account/orders" className="is-desktop-only">
              Track order
            </NavLink>
            <NavLink to="/account" className="is-desktop-only">
              Account
            </NavLink>
            <ThemeToggle />
            <BagButton cart={cart} onClick={() => open('cart')} />
          </div>
        </div>

        {/* On mobile the search field drops to its own full-width row. */}
        <div className="header-search-row">
          <SearchField defaultValue={currentSearch} />
        </div>
      </header>

      <CategoryNav />
    </>
  );
}

/** @param {{defaultValue?: string, className?: string}} props */
function SearchField({defaultValue = '', className = ''}) {
  return (
    <form action="/search" method="get" className={`search-form ${className}`}>
      <SearchIcon />
      <label className="sr-only" htmlFor={`q-${className || 'main'}`}>
        Search silverware
      </label>
      <input
        id={`q-${className || 'main'}`}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search pooja thali, spoons, tumblers, idols…"
      />
      <button type="submit">Search</button>
    </form>
  );
}

/** The eight categories, always visible. */
function CategoryNav() {
  const params = useParams();

  return (
    <nav className="category-nav" aria-label="Categories">
      <div className="category-nav__inner">
        {CATEGORIES.map((category) => (
          <Link
            key={category.handle}
            to={`/collections/${category.handle}`}
            prefetch="intent"
            className={category.muted ? 'is-muted' : undefined}
            aria-current={params.handle === category.handle ? 'page' : undefined}
          >
            {category.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/**
 * The bag shows its running total, not just a count — the design treats the
 * total as the thing worth glancing at.
 * @param {{cart: any, onClick: () => void}} props
 */
function BagButton({cart, onClick}) {
  return (
    <Suspense fallback={<BagButtonInner onClick={onClick} cart={null} />}>
      <Await resolve={cart}>
        {(resolved) => <BagButtonInner cart={resolved} onClick={onClick} />}
      </Await>
    </Suspense>
  );
}

/** @param {{cart: any, onClick: () => void}} props */
function BagButtonInner({cart, onClick}) {
  const optimisticCart = useOptimisticCart(cart);
  const {publish, shop} = useAnalytics();
  const count = optimisticCart?.totalQuantity ?? 0;
  const total = optimisticCart?.cost?.subtotalAmount;

  return (
    <button
      type="button"
      className="bag-button"
      onClick={() => {
        publish('custom_sidecart_viewed', {cart: optimisticCart, shop});
        onClick();
      }}
    >
      <BagIcon />
      <span>
        Bag
        {count > 0 ? ` · ${total ? formatMoney(total) : count}` : ''}
      </span>
    </button>
  );
}

/**
 * The mobile menu contents — the same eight categories plus the account links
 * that the header hides at narrow widths.
 */
export function HeaderMenu() {
  const {close} = useAside();

  return (
    <nav className="mobile-menu" aria-label="Menu">
      {CATEGORIES.map((category) => (
        <Link
          key={category.handle}
          to={`/collections/${category.handle}`}
          onClick={close}
        >
          {category.label}
        </Link>
      ))}
      <Link to="/account/orders" onClick={close}>
        Track order
      </Link>
      <Link to="/account" onClick={close}>
        Account
      </Link>
    </nav>
  );
}
