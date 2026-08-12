/**
 * Pincode → city and state.
 *
 * Auto-filling city and state from the pincode removes two of the eight
 * fields in checkout and is the single biggest reason the form fits on one
 * screen. This ships with a small table so the behaviour is real out of the
 * box; unknown pincodes fall back to editable city and state fields rather
 * than blocking the buyer.
 *
 * TODO(integration): replace `lookupPincode` with a call to the India Post
 * PIN API (or your logistics partner's serviceability endpoint), which also
 * returns whether the pincode is deliverable and its expected transit time.
 */

const PINCODES = {
  641002: {city: 'Coimbatore', state: 'Tamil Nadu'},
  641001: {city: 'Coimbatore', state: 'Tamil Nadu'},
  641012: {city: 'Coimbatore', state: 'Tamil Nadu'},
  600001: {city: 'Chennai', state: 'Tamil Nadu'},
  600017: {city: 'Chennai', state: 'Tamil Nadu'},
  560001: {city: 'Bengaluru', state: 'Karnataka'},
  560034: {city: 'Bengaluru', state: 'Karnataka'},
  400001: {city: 'Mumbai', state: 'Maharashtra'},
  400050: {city: 'Mumbai', state: 'Maharashtra'},
  110001: {city: 'New Delhi', state: 'Delhi'},
  500001: {city: 'Hyderabad', state: 'Telangana'},
  682001: {city: 'Kochi', state: 'Kerala'},
  380001: {city: 'Ahmedabad', state: 'Gujarat'},
  700001: {city: 'Kolkata', state: 'West Bengal'},
  411001: {city: 'Pune', state: 'Maharashtra'},
};

/** A pincode is six digits, and never starts with zero. */
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

/** @param {string} value */
export function isValidPincode(value) {
  return PINCODE_PATTERN.test(String(value ?? '').trim());
}

/**
 * @param {string} value
 * @returns {{city: string, state: string}|null}
 */
export function lookupPincode(value) {
  const key = String(value ?? '').trim();
  if (!isValidPincode(key)) return null;
  return PINCODES[key] ?? null;
}
