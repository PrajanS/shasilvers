import {CartForm} from '@shopify/hydrogen';
import {useId} from 'react';
import {Button} from '~/components/Button';
import {formatAmount, formatGrams} from '~/lib/money';
import {cartWeightGrams, cartTotals} from '~/lib/cart-totals';

/**
 * Every cost, before the buyer commits.
 *
 * The shipping line is named explicitly rather than left to appear at
 * checkout — an unexpected line at the payment step is the single largest
 * cause of abandonment, and this shop's whole pitch is that nothing is added
 * after the fact.
 *
 * Line prices are calculated from the day's rates, exactly as they are on the
 * product page, so the bag never restates an article at a different figure.
 *
 * @param {{cart: any, rates?: any}} props
 */
export function CartSummary({cart, rates}) {
  const summaryId = useId();
  const totals = cartTotals(cart, rates);
  const grams = cartWeightGrams(cart, rates);

  if (!totals) return null;

  const {currencyCode, subtotal, shipping, total, freeShipping} = totals;

  return (
    <div className="cart-summary" aria-labelledby={summaryId}>
      <h4 id={summaryId} className="sr-only">
        Bag totals
      </h4>

      <CartDiscount discountCodes={cart?.discountCodes} />

      <dl className="cart-summary__rows">
        <div className="cart-summary__row">
          <dt>Subtotal{grams ? ` · ${formatGrams(grams)}` : ''}</dt>
          <dd>{formatAmount(subtotal, currencyCode)}</dd>
        </div>

        <div
          className={`cart-summary__row ${freeShipping ? 'cart-summary__row--free' : ''}`}
        >
          <dt>Shipping (insured)</dt>
          <dd>
            {freeShipping ? 'Free' : formatAmount(shipping, currencyCode)}
          </dd>
        </div>

        <hr className="hairline" />

        <div className="cart-summary__row cart-summary__row--total">
          <dt>Total payable</dt>
          <dd>{formatAmount(total, currencyCode)}</dd>
        </div>
      </dl>

      {/*
        Checkout is our own one-page route, which collects contact and delivery
        details and then hands the order to Shopify's hosted checkout for
        payment. See app/routes/checkout.jsx.
      */}
      <Button to="/checkout" variant="primary" block>
        Checkout
      </Button>

      <p className="cart-summary__note">
        No account needed · UPI, cards and net banking at payment
      </p>
    </div>
  );
}

/** @param {{discountCodes?: any[]}} props */
function CartDiscount({discountCodes}) {
  const inputId = useId();
  const codes =
    discountCodes?.filter((d) => d.applicable)?.map(({code}) => code) ?? [];

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes: codes}}
    >
      <div className="cart-discount">
        <label className="sr-only" htmlFor={inputId}>
          Coupon code
        </label>
        <input
          id={inputId}
          className="field__input"
          type="text"
          name="discountCode"
          placeholder={codes.length ? codes.join(', ') : 'Coupon code'}
        />
        <button type="submit" className="btn btn--outline">
          Apply
        </button>
      </div>
    </CartForm>
  );
}
