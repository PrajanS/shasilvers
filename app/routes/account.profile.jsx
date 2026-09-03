import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import {Field, ReadonlyField} from '~/components/Field';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'Profile — Sha Silvers'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer = {};
    // Only the two fields Shopify lets a storefront change. Email and phone are
    // the sign-in identity and are deliberately not in this list.
    const validInputKeys = ['firstName', 'lastName'];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key] = value;
      }
    }

    const {data: result, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!result?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: result.customerUpdate.customer,
    };
  } catch (error) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext();
  const {state} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const customer = action?.customer ?? account?.customer ?? {};
  const saving = state !== 'idle';

  const email = customer.emailAddress?.emailAddress;
  const phone = customer.phoneNumber?.phoneNumber;

  return (
    <section className="account-panel">
      <header className="account-panel__head">
        <h2 className="t-display-s">My profile</h2>
        <p className="t-meta">
          The name we put on the invoice and the parcel.
        </p>
      </header>

      <Form method="PUT" className="account-form">
        {action?.error ? (
          <p className="account-form__error" role="alert">
            {action.error}
          </p>
        ) : null}

        {action?.customer ? (
          <p className="account-form__ok" role="status">
            Profile updated.
          </p>
        ) : null}

        <div className="account-form__grid">
          <Field
            label="First name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            defaultValue={customer.firstName ?? ''}
            minLength={2}
          />
          <Field
            label="Last name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            defaultValue={customer.lastName ?? ''}
            minLength={2}
          />
        </div>

        {/* Shopify owns the sign-in identity: changing either here would
            desynchronise the login, so both are shown and neither is editable. */}
        {email || phone ? (
          <div className="account-form__readonly">
            <p className="t-eyebrow">Sign-in details</p>
            <div className="account-form__grid">
              {email ? <ReadonlyField label="Email" value={email} /> : null}
              {phone ? <ReadonlyField label="Phone" value={phone} /> : null}
            </div>
            <p className="t-meta">
              Email and phone are managed by your Shopify login, not here.
            </p>
          </div>
        ) : null}

        <div className="account-form__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Updating' : 'Update profile'}
          </button>
        </div>
      </Form>
    </section>
  );
}

/**
 * @typedef {{
 *   error: string | null;
 *   customer: CustomerFragment | null;
 * }} ActionResponse
 */

/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @typedef {import('@shopify/hydrogen/customer-account-api-types').CustomerUpdateInput} CustomerUpdateInput */
/** @typedef {import('./+types/account.profile').Route} Route */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
