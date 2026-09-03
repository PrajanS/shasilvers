import {redirect} from 'react-router';
import {numericId, positiveInt} from '~/lib/redirect';

/** More than this many distinct variants in one link is not a real order. */
const MAX_LINES = 25;

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```js
 * /cart/<variant_id>:<quantity>
 *
 * ```
 *
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL, for
 * carts with more than one product variant.
 *
 * @example
 * Example path creating a cart with two product variants, different quantities, and a discount code in the querystring:
 * ```js
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * ```
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context, params}) {
  const {cart} = context;
  const {lines} = params;
  if (!lines) return redirect('/cart');

  // Everything here comes from the URL. The variant id is interpolated into a
  // gid, so it must be digits and nothing else, and the quantity used to be a
  // bare `parseInt` — a link ending `:` sent `NaN` straight to Shopify.
  // Anything malformed drops its line rather than failing the whole link.
  const linesMap = [];
  for (const line of lines.split(',').slice(0, MAX_LINES)) {
    const [rawId, rawQuantity] = line.split(':');
    const variantId = numericId(rawId);
    const quantity = positiveInt(rawQuantity);
    if (!variantId || !quantity) continue;

    linesMap.push({
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    });
  }

  if (!linesMap.length) {
    throw new Response('That cart link is not valid.', {status: 400});
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  // create a cart
  const result = await cart.create({
    lines: linesMap,
    discountCodes: discountArray,
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Response('Link may be expired. Try checking the URL.', {
      status: 410,
    });
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  // redirect to checkout
  if (cartResult.checkoutUrl) {
    return redirect(cartResult.checkoutUrl, {headers});
  } else {
    throw new Error('No checkout URL found');
  }
}

export default function Component() {
  return null;
}

/** @typedef {import('./+types/cart.$lines').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
