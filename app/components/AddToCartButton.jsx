import {CartForm} from '@shopify/hydrogen';

/**
 * Adds lines to the cart. Styled as one of the system buttons so quick-add on
 * a tile and Add to bag on a product page are the same control.
 *
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 *   variant?: 'primary'|'secondary'|'quickadd'|'outline';
 *   className?: string;
 *   formClassName?: string;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  variant = 'primary',
  className = '',
  formClassName = '',
}) {
  return (
    <CartForm
      route="/cart"
      inputs={{lines}}
      action={CartForm.ACTIONS.LinesAdd}
      // The form must not introduce its own box in flex/grid layouts.
      fetcherKey={undefined}
    >
      {(fetcher) => (
        <div className={formClassName}>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            className={`btn btn--${variant} ${className}`.trim()}
            onClick={onClick}
            disabled={disabled || fetcher.state !== 'idle'}
          >
            {fetcher.state !== 'idle' ? 'Adding…' : children}
          </button>
        </div>
      )}
    </CartForm>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
