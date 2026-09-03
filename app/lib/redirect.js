import {redirect} from 'react-router';

/**
 * A redirect target taken from the URL, reduced to something safe to send.
 *
 * `/discount/:code?redirect=…` lets the query string choose where the buyer
 * lands, which is an open redirect unless the value is constrained — a link
 * that looks like ours but lands on someone else's login form is the whole
 * phishing technique.
 *
 * The rule is: a single-slash absolute path on this origin, nothing else. In
 * particular this rejects
 *
 *   //evil.com        protocol-relative — the browser treats it as a host
 *   /\evil.com        backslash; browsers normalise `\` to `/`, so this is
 *                     protocol-relative too, and it survives a naive
 *                     `includes('//')` check because it contains no `//`
 *   https://evil.com  absolute, any scheme
 *   javascript:…      scheme with no slash at all
 *
 * Control characters are stripped first: browsers drop tab, newline and
 * carriage return from URLs, so a value with one embedded could otherwise
 * smuggle a protocol-relative URL past a check that ran before the stripping.
 *
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string} `value` when it is a safe local path, else `fallback`.
 */
export function safeRedirectPath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;

  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();

  // Must be an absolute path, and the character after the slash must not turn
  // it into a host reference.
  if (!/^\/(?![/\\])/.test(cleaned)) return fallback;

  return cleaned;
}

/**
 * A positive integer from an untrusted URL segment.
 *
 * Returns null rather than NaN or a negative, so a caller cannot pass either
 * on to Shopify. `max` caps the plausible rather than the possible — a link
 * asking for ten thousand of one article is a mistake or an attack, not an
 * order.
 *
 * @param {string|null|undefined} value
 * @param {{max?: number}} [options]
 * @returns {number|null}
 */
export function positiveInt(value, {max = 100} = {}) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  if (!Number.isSafeInteger(n) || n < 1 || n > max) return null;
  return n;
}

/**
 * A Shopify numeric id from an untrusted URL segment.
 *
 * Ids are interpolated into a `gid://shopify/…` string, so anything but digits
 * would let the URL write part of that identifier.
 *
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function numericId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{1,20}$/.test(trimmed) ? trimmed : null;
}

/**
 * @param {Request} request
 * @param {...Array<{
 *     handle: string;
 *     data: {handle: string} & unknown;
 *   }>} [localizedResources]
 */
export function redirectIfHandleIsLocalized(request, ...localizedResources) {
  const url = new URL(request.url);
  let shouldRedirect = false;

  localizedResources.forEach(({handle, data}) => {
    if (handle !== data.handle) {
      url.pathname = url.pathname.replace(handle, data.handle);
      shouldRedirect = true;
    }
  });

  if (shouldRedirect) {
    throw redirect(url.toString());
  }
}
