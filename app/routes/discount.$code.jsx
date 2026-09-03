import {redirect} from 'react-router';
import {safeRedirectPath} from '~/lib/redirect';

/**
 * Automatically applies a discount found on the url
 * If a cart exists it's updated with the discount, otherwise a cart is created with the discount already applied
 *
 * @example
 * Example path applying a discount and optional redirecting (defaults to the home page)
 * ```js
 * /discount/FREESHIPPING?redirect=/products
 *
 * ```
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context, params}) {
  const {cart} = context;
  const {code} = params;

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  // Where we land is chosen by the query string, so it has to be constrained
  // to this origin. The previous `includes('//')` check let `/\evil.com`
  // through — browsers normalise the backslash, making it protocol-relative.
  const redirectParam = safeRedirectPath(
    searchParams.get('redirect') || searchParams.get('return_to'),
  );

  searchParams.delete('redirect');
  searchParams.delete('return_to');

  const redirectUrl = `${redirectParam}?${searchParams}`;

  if (!code) {
    return redirect(redirectUrl);
  }

  const result = await cart.updateDiscountCodes([code]);
  const headers = cart.setCartId(result.cart.id);

  // Using set-cookie on a 303 redirect will not work if the domain origin have port number (:3000)
  // If there is no cart id and a new cart id is created in the progress, it will not be set in the cookie
  // on localhost:3000
  return redirect(redirectUrl, {
    status: 303,
    headers,
  });
}

/** @typedef {import('./+types/discount.$code').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
