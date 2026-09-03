import {useId} from 'react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'Addresses — Sha Silvers'}];
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

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address = {};
    const keys = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext();
  const {defaultAddress, addresses} = customer;

  return (
    <section className="account-panel">
      <header className="account-panel__head">
        <h2 className="t-display-s">Addresses</h2>
        <p className="t-meta">
          Where we send the parcel. The default is used to prefill checkout.
        </p>
      </header>

      <div className="account-addresses">
        <div className="account-address">
          <h3 className="t-label">Add an address</h3>
          <NewAddressForm key={addresses.nodes.length} />
        </div>

        {addresses.nodes.length ? (
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        ) : (
          <p className="t-meta">No addresses saved yet.</p>
        )}
      </div>
    </section>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  };

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <div className="account-address__actions">
          <button
            className="btn btn--primary"
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
          >
            {stateForMethod('POST') !== 'idle' ? 'Creating' : 'Create address'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

/**
 * @param {Pick<CustomerFragment, 'addresses' | 'defaultAddress'>}
 */
function ExistingAddresses({addresses, defaultAddress}) {
  return (
    <>
      {addresses.nodes.map((address) => (
        <div className="account-address" key={address.id}>
          <h3 className="t-label">
            Saved address
            {defaultAddress?.id === address.id ? (
              <span className="account-address__default">Default</span>
            ) : null}
          </h3>
          <AddressForm
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="account-address__actions">
                <button
                  className="btn btn--primary"
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Saving' : 'Save'}
                </button>
                <button
                  className="btn btn--outline"
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                >
                  {stateForMethod('DELETE') !== 'idle' ? 'Deleting' : 'Delete'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </>
  );
}

/**
 * @param {{
 *   addressId: AddressFragment['id'];
 *   address: CustomerAddressInput;
 *   defaultAddress: CustomerFragment['defaultAddress'];
 *   children: (props: {
 *     stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
 *   }) => React.ReactNode;
 * }}
 */
export function AddressForm({addressId, address, defaultAddress, children}) {
  const {state, formMethod} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;

  // Several of these forms render at once — the new-address form plus one per
  // saved address. A fixed id would make every label on the page point at the
  // first form's input, so ids are scoped per form instance.
  const uid = useId();
  /** @param {string} name */
  const fieldId = (name) => `${uid}-${name}`;

  return (
    <Form id={addressId} className="address-form">
      <input type="hidden" name="addressId" defaultValue={addressId} />
      <div className="address-form__grid">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('firstName')}>
            First name*
          </label>
          <input
            className="field__input"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            id={fieldId('firstName')}
            name="firstName"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('lastName')}>
            Last name*
          </label>
          <input
            className="field__input"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            id={fieldId('lastName')}
            name="lastName"
            required
            type="text"
          />
        </div>

        <div className="field field--wide">
          <label className="field__label" htmlFor={fieldId('company')}>
            Company
          </label>
          <input
            className="field__input"
            autoComplete="organization"
            defaultValue={address?.company ?? ''}
            id={fieldId('company')}
            name="company"
            type="text"
          />
        </div>

        <div className="field field--wide">
          <label className="field__label" htmlFor={fieldId('address1')}>
            Address line 1*
          </label>
          <input
            className="field__input"
            autoComplete="address-line1"
            defaultValue={address?.address1 ?? ''}
            id={fieldId('address1')}
            name="address1"
            required
            type="text"
          />
        </div>

        <div className="field field--wide">
          <label className="field__label" htmlFor={fieldId('address2')}>
            Address line 2
          </label>
          <input
            className="field__input"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ''}
            id={fieldId('address2')}
            name="address2"
            type="text"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('city')}>
            City*
          </label>
          <input
            className="field__input"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            id={fieldId('city')}
            name="city"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('zoneCode')}>
            State*
          </label>
          <input
            className="field__input"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            id={fieldId('zoneCode')}
            name="zoneCode"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('zip')}>
            PIN code*
          </label>
          <input
            className="field__input"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            id={fieldId('zip')}
            name="zip"
            required
            type="text"
            inputMode="numeric"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('territoryCode')}>
            Country code*
          </label>
          <input
            className="field__input"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? 'IN'}
            id={fieldId('territoryCode')}
            name="territoryCode"
            required
            type="text"
            maxLength={2}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId('phoneNumber')}>
            Phone
          </label>
          <input
            className="field__input"
            autoComplete="tel"
            defaultValue={address?.phoneNumber ?? ''}
            id={fieldId('phoneNumber')}
            name="phoneNumber"
            placeholder="+919843000000"
            pattern="^\+?[1-9]\d{3,14}$"
            type="tel"
          />
        </div>
      </div>

      <label className="checkbox-row" htmlFor={fieldId('defaultAddress')}>
        <input
          defaultChecked={isDefaultAddress}
          id={fieldId('defaultAddress')}
          name="defaultAddress"
          type="checkbox"
        />
        Set as default address
      </label>

      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}

      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}

/**
 * @typedef {{
 *   addressId?: string | null;
 *   createdAddress?: AddressFragment;
 *   defaultAddress?: string | null;
 *   deletedAddress?: string | null;
 *   error: Record<AddressFragment['id'], string> | null;
 *   updatedAddress?: AddressFragment;
 * }} ActionResponse
 */

/** @typedef {import('@shopify/hydrogen/customer-account-api-types').CustomerAddressInput} CustomerAddressInput */
/** @typedef {import('customer-accountapi.generated').AddressFragment} AddressFragment */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @template T @typedef {import('react-router').Fetcher<T>} Fetcher */
/** @typedef {import('./+types/account.addresses').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
