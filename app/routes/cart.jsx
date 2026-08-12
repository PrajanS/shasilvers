import {useLoaderData, data} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {isDemoMode} from '~/lib/demo/mode';
import {
  getDemoCart,
  demoAddLines,
  demoUpdateLines,
  demoRemoveLines,
  demoUpdateAttributes,
  demoUpdateBuyerIdentity,
} from '~/lib/demo/cart.server';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'Your bag — Sha Silvers'}];
};

/**
 * @type {HeadersFunction}
 */
export const headers = ({actionHeaders}) => actionHeaders;

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const {cart, env, session} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result;

  // DEMO: mutate the session bag instead of Shopify's Cart API. Same action
  // names, same returned shape, so CartForm callers are unchanged.
  if (isDemoMode(env)) {
    switch (action) {
      case CartForm.ACTIONS.LinesAdd:
        result = {cart: demoAddLines(session, inputs.lines)};
        break;
      case CartForm.ACTIONS.LinesUpdate:
        result = {cart: demoUpdateLines(session, inputs.lines)};
        break;
      case CartForm.ACTIONS.LinesRemove:
        result = {cart: demoRemoveLines(session, inputs.lineIds)};
        break;
      case CartForm.ACTIONS.AttributesUpdateInput:
        result = {cart: demoUpdateAttributes(session, inputs.attributes)};
        break;
      case CartForm.ACTIONS.BuyerIdentityUpdate:
        result = {cart: demoUpdateBuyerIdentity(session, inputs.buyerIdentity)};
        break;
      default:
        // Discounts and gift cards are storefront features the demo bag does
        // not model; return the bag unchanged rather than erroring.
        result = {cart: getDemoCart(session)};
    }

    const redirectTo = formData.get('redirectTo') ?? null;
    const headers = new Headers();
    if (typeof redirectTo === 'string') {
      status = 303;
      headers.set('Location', redirectTo);
    }

    return data(
      {cart: result.cart, errors: [], warnings: [], analytics: {cartId: result.cart.id}},
      {status, headers},
    );
  }

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes;
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {cart, env, session} = context;
  if (isDemoMode(env)) return getDemoCart(session);
  return await cart.get();
}

export default function Cart() {
  /** @type {LoaderReturnData} */
  const cart = useLoaderData();

  // The bag is normally a drawer; this route is the full-page view it falls
  // back to without JavaScript, and the target of a direct /cart link.
  return (
    <div className="cart-main--page">
      <h1 className="t-display-l" style={{marginBottom: 20}}>
        Your bag
      </h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}

/** @typedef {import('react-router').HeadersFunction} HeadersFunction */
/** @typedef {import('./+types/cart').Route} Route */
/** @typedef {import('@shopify/hydrogen').CartQueryDataReturn} CartQueryDataReturn */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
