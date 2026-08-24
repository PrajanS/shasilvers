/**
 * One-page checkout.
 *
 * Scope, stated plainly: Hydrogen does not own payment. Card numbers, UPI
 * collect requests and card authorisation are handled by Shopify's hosted
 * checkout (or by Checkout UI extensions / a headless payments integration if
 * you take that on later). This route is the part a headless storefront *can*
 * own and that the design cares most about — contact and delivery captured on
 * one page, as a guest, with every cost visible before the buyer commits.
 *
 * What it really does:
 *   1. Validates the eight fields.
 *   2. Writes email, phone and the delivery address onto the cart's buyer
 *      identity, so none of it has to be typed again.
 *   3. Hands off to `cart.checkoutUrl` for payment.
 *
 * The payment section below is therefore a *preference*, recorded as a cart
 * attribute and shown again at the secure step — it never collects credentials
 * and never pretends to charge a card.
 */

import {useEffect, useRef, useState} from 'react';
import {useActionData, useLoaderData, Form, Link, redirect} from 'react-router';
import {Field, ReadonlyField} from '~/components/Field';
import {MediaWell} from '~/components/MediaWell';
import {LockIcon} from '~/components/Icons';
import {formatAmount, formatGrams} from '~/lib/money';
import {cartTotals, cartWeightGrams} from '~/lib/cart-totals';
import {isValidPincode, lookupPincode} from '~/lib/pincode';
import {getDeliveryEstimate} from '~/lib/delivery';
import {getMetalRates} from '~/lib/metal-rates.server';
import {SHOP} from '~/lib/shop';

/** @type {Route.MetaFunction} */
export const meta = () => [{title: 'Secure checkout — Sha Silvers'}];

const PAYMENT_METHODS = [
  {value: 'upi', label: 'UPI · PhonePe, GPay, Paytm', note: 'Instant'},
  {value: 'card', label: 'Card · Visa, Mastercard, RuPay'},
  {value: 'netbanking', label: 'Net banking'},
];

/** @param {Route.LoaderArgs} args */
export async function loader({context}) {
  const cart = await context.cart.get();

  return {
    cart,
    rates: await getMetalRates(context.storefront),
    delivery: getDeliveryEstimate(),
  };
}

/** @param {Route.ActionArgs} args */
export async function action({request, context}) {
  const formData = await request.formData();

  const values = {
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    address1: String(formData.get('address1') ?? '').trim(),
    pincode: String(formData.get('pincode') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    state: String(formData.get('state') ?? '').trim(),
    payment: String(formData.get('payment') ?? 'upi'),
  };

  /** @type {Record<string, string>} */
  const errors = {};
  if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(values.phone.replace(/\s/g, ''))) {
    errors.phone = 'Enter a 10-digit Indian mobile number';
  }
  if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!values.name) errors.name = 'Enter the name for the delivery';
  if (!values.address1) errors.address1 = 'Enter the flat, street and area';
  if (!isValidPincode(values.pincode)) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  const resolved = lookupPincode(values.pincode);
  const city = resolved?.city ?? values.city;
  const state = resolved?.state ?? values.state;
  if (!errors.pincode && (!city || !state)) {
    errors.city = 'Enter the city and state for this pincode';
  }

  if (Object.keys(errors).length) {
    return {errors, values};
  }

  const cart = await context.cart.get();
  if (!cart?.checkoutUrl) {
    return {
      errors: {form: 'Your bag is empty.'},
      values,
    };
  }

  const [firstName, ...rest] = values.name.split(' ');

  // Carry everything we collected onto the cart so the buyer is not asked for
  // it a second time at the payment step. If a storefront does not support
  // buyer-identity updates we still continue — losing the prefill is a far
  // better outcome than losing the order.
  try {
    await context.cart.updateBuyerIdentity({
      email: values.email || undefined,
      phone: values.phone,
      countryCode: 'IN',
      deliveryAddressPreferences: [
        {
          deliveryAddress: {
            firstName: firstName || values.name,
            lastName: rest.join(' ') || undefined,
            address1: values.address1,
            city,
            provinceCode: undefined,
            province: state,
            zip: values.pincode,
            countryCode: 'IN',
            phone: values.phone,
          },
        },
      ],
    });

    // The chosen method travels as an attribute so the shop can see intent
    // even when the buyer switches method at the secure step.
    await context.cart.updateAttributes([
      {key: 'preferred_payment', value: values.payment},
    ]);
  } catch (error) {
    console.error('Could not pre-fill checkout from the one-page form', error);
  }

  const updated = await context.cart.get();
  return redirect(updated?.checkoutUrl ?? cart.checkoutUrl);
}

export default function Checkout() {
  /** @type {LoaderReturnData} */
  const {cart, rates, delivery} = useLoaderData();
  const actionData = useActionData();
  const errors = actionData?.errors ?? {};

  const [pincode, setPincode] = useState(actionData?.values?.pincode ?? '');
  const [payment, setPayment] = useState(actionData?.values?.payment ?? 'upi');
  const resolvedArea = lookupPincode(pincode);

  // Errors used to be returned and left for the buyer to find — on a phone the
  // failing field is often off-screen, so the form appeared to do nothing.
  const errorSummaryRef = useRef(null);
  const errorEntries = Object.entries(errors);

  useEffect(() => {
    if (errorEntries.length) errorSummaryRef.current?.focus();
    // Re-runs whenever a new action response arrives.
  }, [actionData]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = cartTotals(cart, rates);
  const grams = cartWeightGrams(cart, rates);
  const lines = cart?.lines?.nodes ?? [];

  if (!totals || !lines.length) {
    return (
      <div className="checkout">
        <CheckoutBar />
        <div className="checkout__form">
          <p className="empty-state">
            Your bag is empty.{' '}
            <Link className="link-inline" to="/collections/pooja-articles">
              Browse pooja articles →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const {currencyCode, subtotal, shipping, total, freeShipping} = totals;

  return (
    <div className="checkout">
      <CheckoutBar />

      <Form method="post" className="checkout__grid">
        <div className="checkout__form">
          {errorEntries.length ? (
            <div
              className="error-summary"
              role="alert"
              tabIndex={-1}
              ref={errorSummaryRef}
            >
              <p className="error-summary__title">
                {errorEntries.length === 1
                  ? 'One detail needs fixing'
                  : `${errorEntries.length} details need fixing`}
              </p>
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#field-${field}`}>{message}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/*
            These select the payment method. They are not accelerated wallets:
            a delivery address is still required, and true one-tap checkout
            (Shop Pay, Google Pay) is a Shopify checkout feature rather than a
            storefront one. Labelling them as buttons that pay would be a lie.
          */}
          <div className="checkout__express" role="group" aria-label="Pay with">
            {[
              {value: 'upi', label: 'UPI'},
              {value: 'card', label: 'Card'},
              {value: 'netbanking', label: 'Net banking'},
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={payment === option.value}
                className={`btn ${payment === option.value ? 'btn--secondary' : 'btn--outline'}`}
                onClick={() => setPayment(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="t-meta" style={{marginTop: -14}}>
            Delivery details are still needed — these only choose how you pay.
          </p>

          <div className="checkout__divider">or enter details</div>

          <section>
            <div className="checkout__step-head">
              <span className="t-label">1 · Contact &amp; delivery</span>
              <span className="checkout__guest">
                Buying as guest ·{' '}
                <Link className="link-inline" to="/account">
                  sign in
                </Link>
              </span>
            </div>

            <div className="checkout__fields">
              <Field
                className="span-2"
                label="Phone number"
                name="phone"
                id="field-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                defaultValue={actionData?.values?.phone ?? ''}
                error={errors.phone}
              />
              <Field
                className="span-2"
                label="Email for invoice &amp; tracking"
                name="email"
                id="field-email"
                type="email"
                autoComplete="email"
                defaultValue={actionData?.values?.email ?? ''}
                error={errors.email}
              />
              <Field
                className="span-2"
                label="Full name"
                name="name"
                id="field-name"
                autoComplete="name"
                required
                defaultValue={actionData?.values?.name ?? ''}
                error={errors.name}
              />
              <Field
                className="span-2"
                label="Flat, street, area"
                name="address1"
                id="field-address1"
                autoComplete="address-line1"
                required
                defaultValue={actionData?.values?.address1 ?? ''}
                error={errors.address1}
              />
              <Field
                label="Pincode"
                name="pincode"
                id="field-pincode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                required
                value={pincode}
                onChange={(event) => setPincode(event.currentTarget.value)}
                error={errors.pincode}
              />

              {resolvedArea ? (
                <>
                  <ReadonlyField
                    label="City and state"
                    value={`${resolvedArea.city}, ${resolvedArea.state} — auto-filled`}
                  />
                  <input type="hidden" name="city" value={resolvedArea.city} />
                  <input
                    type="hidden"
                    name="state"
                    value={resolvedArea.state}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="City"
                    name="city"
                    id="field-city"
                    autoComplete="address-level2"
                    defaultValue={actionData?.values?.city ?? ''}
                    error={errors.city}
                  />
                  <Field
                    className="span-2"
                    label="State"
                    name="state"
                    id="field-state"
                    autoComplete="address-level1"
                    defaultValue={actionData?.values?.state ?? ''}
                  />
                </>
              )}
            </div>

            <label className="checkbox-row" style={{marginTop: 12}}>
              <input type="checkbox" name="saveAddress" defaultChecked />
              Save this address for next time
            </label>
          </section>

          <section>
            <div className="t-label" style={{marginBottom: 14}}>
              2 · Payment
            </div>
            <div className="checkout__payments">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`radio-row ${payment === method.value ? 'radio-row--selected' : ''}`}
                >
                  <span className="radio-row__label">
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={payment === method.value}
                      onChange={() => setPayment(method.value)}
                    />
                    {method.label}
                  </span>
                  {method.note ? (
                    <span className="radio-row__note radio-row__note--positive">
                      {method.note}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>

            <p className="checkout__notice" style={{marginTop: 14}}>
              <strong>Payment is taken on Shopify’s secure checkout.</strong>{' '}
              Continuing carries your contact details and address across, so you
              only confirm and pay. Your method choice is remembered.
            </p>
          </section>

          {errors.form ? <p className="field__error">{errors.form}</p> : null}
        </div>

        <aside className="checkout__aside">
          <div className="checkout__step-head" style={{marginBottom: 0}}>
            <span className="t-label">Order summary</span>
            <Link className="link-inline" to="/cart">
              Edit bag
            </Link>
          </div>

          {lines.map((line) => (
            <div className="summary-line" key={line.id}>
              <MediaWell
                data={line.merchandise?.image}
                note="1:1"
                sizes="56px"
                className="summary-line__media"
              />
              <div>
                <div className="summary-line__title">
                  {line.merchandise?.product?.title}
                </div>
                <div className="summary-line__meta">
                  {line.merchandise?.weight
                    ? `${formatGrams(line.merchandise.weight)} · `
                    : ''}
                  qty {line.quantity}
                </div>
              </div>
              <span className="summary-line__price">
                {formatAmount(
                  Number(line.cost?.totalAmount?.amount ?? 0),
                  currencyCode,
                )}
              </span>
            </div>
          ))}

          <hr className="hairline" />

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
              <dt>Total</dt>
              <dd>{formatAmount(total, currencyCode)}</dd>
            </div>
          </dl>

          <button type="submit" className="btn btn--primary btn--block">
            Continue to pay {formatAmount(total, currencyCode)}
          </button>

          <p className="checkout__handoff">
            Delivery by {delivery.long}. Hallmark certificate and invoice are
            included in the parcel. 7-day return, lifetime buyback.
          </p>
        </aside>
      </Form>
    </div>
  );
}

function CheckoutBar() {
  return (
    <div className="checkout__bar">
      <Link to="/" className="wordmark__name">
        {SHOP.name}
      </Link>
      <span className="checkout__secure">
        <LockIcon />
        Secure checkout · 256-bit
      </span>
    </div>
  );
}

/** @typedef {import('./+types/checkout').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
