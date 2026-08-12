/**
 * Demo bag — a session-backed cart for demo mode.
 *
 * The demo catalogue's variant IDs are ours, not Shopify's, so Shopify's Cart
 * API cannot hold them. Without this the bag drawer, the totals and the
 * checkout could not be reviewed at all — which is most of the flow the design
 * is about.
 *
 * It returns the same shape as Hydrogen's cart query fragment, so
 * `CartMain`, `CartLineItem`, `CartSummary` and the checkout route consume it
 * without knowing which mode they are in.
 *
 * ONLY USED IN DEMO MODE. With a real store connected, `context.cart` (the
 * genuine Hydrogen cart handler) is used instead and nothing here runs.
 */

import {getDemoVariant} from '~/lib/demo/catalogue';

const SESSION_KEY = 'demoCartLines';

/**
 * @param {any} session
 * @returns {Array<{variantId: string, quantity: number}>}
 */
function readLines(session) {
  const raw = session.get(SESSION_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((line) => line && typeof line.variantId === 'string');
}

/**
 * @param {any} session
 * @param {Array<{variantId: string, quantity: number}>} lines
 */
function writeLines(session, lines) {
  session.set(
    SESSION_KEY,
    lines.filter((line) => line.quantity > 0),
  );
}

/** A cart line id is derived from its variant, so it is stable across requests. */
function lineId(variantId) {
  return `demo://CartLine/${variantId}`;
}

/** @param {string} id */
function variantIdFromLineId(id) {
  return String(id).replace('demo://CartLine/', '');
}

/**
 * Materialise the stored lines into a full cart object.
 * @param {any} session
 */
export function getDemoCart(session) {
  const stored = readLines(session);

  const nodes = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const stored_line of stored) {
    const found = getDemoVariant(stored_line.variantId);
    if (!found) continue;

    const {product, variant} = found;
    const unit = Number(variant.price.amount);
    const lineTotal = unit * stored_line.quantity;

    subtotal += lineTotal;
    totalQuantity += stored_line.quantity;

    nodes.push({
      id: lineId(variant.id),
      quantity: stored_line.quantity,
      attributes: [],
      cost: {
        totalAmount: {amount: lineTotal.toFixed(2), currencyCode: 'INR'},
        amountPerQuantity: {amount: unit.toFixed(2), currencyCode: 'INR'},
        compareAtAmountPerQuantity: null,
      },
      merchandise: {
        id: variant.id,
        availableForSale: variant.availableForSale,
        compareAtPrice: null,
        price: variant.price,
        image: variant.image,
        weight: variant.weight,
        weightUnit: variant.weightUnit,
        product: {
          handle: product.handle,
          title: product.title,
          id: product.id,
          vendor: product.vendor,
        },
        selectedOptions: variant.selectedOptions,
      },
    });
  }

  return {
    id: 'demo://Cart/session',
    totalQuantity,
    // No hosted checkout exists for demo articles. The checkout route reads
    // this and completes to the confirmation screen instead of redirecting.
    checkoutUrl: null,
    discountCodes: [],
    appliedGiftCards: [],
    attributes: readAttributes(session),
    buyerIdentity: session.get('demoBuyerIdentity') ?? null,
    cost: {
      subtotalAmount: {amount: subtotal.toFixed(2), currencyCode: 'INR'},
      totalAmount: {amount: subtotal.toFixed(2), currencyCode: 'INR'},
      totalTaxAmount: null,
      totalDutyAmount: null,
    },
    lines: {nodes},
  };
}

/** @param {any} session */
function readAttributes(session) {
  const raw = session.get('demoCartAttributes');
  return Array.isArray(raw) ? raw : [];
}

/**
 * @param {any} session
 * @param {Array<{merchandiseId: string, quantity?: number}>} inputLines
 */
export function demoAddLines(session, inputLines = []) {
  const lines = readLines(session);

  for (const input of inputLines) {
    if (!getDemoVariant(input.merchandiseId)) continue;
    const quantity = Number(input.quantity ?? 1) || 1;
    const existing = lines.find((line) => line.variantId === input.merchandiseId);
    if (existing) existing.quantity += quantity;
    else lines.push({variantId: input.merchandiseId, quantity});
  }

  writeLines(session, lines);
  return getDemoCart(session);
}

/**
 * @param {any} session
 * @param {Array<{id: string, quantity: number}>} inputLines
 */
export function demoUpdateLines(session, inputLines = []) {
  const lines = readLines(session);

  for (const input of inputLines) {
    const variantId = variantIdFromLineId(input.id);
    const existing = lines.find((line) => line.variantId === variantId);
    if (existing) existing.quantity = Number(input.quantity) || 0;
  }

  writeLines(session, lines);
  return getDemoCart(session);
}

/**
 * @param {any} session
 * @param {string[]} lineIds
 */
export function demoRemoveLines(session, lineIds = []) {
  const removing = new Set(lineIds.map(variantIdFromLineId));
  writeLines(
    session,
    readLines(session).filter((line) => !removing.has(line.variantId)),
  );
  return getDemoCart(session);
}

/**
 * @param {any} session
 * @param {Array<{key: string, value: string}>} attributes
 */
export function demoUpdateAttributes(session, attributes = []) {
  session.set('demoCartAttributes', attributes);
  return getDemoCart(session);
}

/**
 * @param {any} session
 * @param {object} buyerIdentity
 */
export function demoUpdateBuyerIdentity(session, buyerIdentity = {}) {
  session.set('demoBuyerIdentity', buyerIdentity);
  return getDemoCart(session);
}

/** Empties the bag — used once the demo order is placed. */
export function demoClearCart(session) {
  session.set(SESSION_KEY, []);
  session.set('demoCartAttributes', []);
}
