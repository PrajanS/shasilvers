import {useId, useRef, useState} from 'react';
import {Form, Link, useSubmit} from 'react-router';
import {formatAmount} from '~/lib/money';
import {
  SORT_OPTIONS,
  DEFAULT_SORT,
  clearFiltersSearch,
  getActiveChipsFor,
  getSort,
  parseFilters,
  toggleFilterSearch,
  withTypeOptions,
} from '~/lib/collection-filters';

/**
 * Filter and sort controls, shared by the category listing and search.
 *
 * These lived inside `collections.$handle` while search had no filters at all —
 * so the two screens offered different controls over the same catalogue. They
 * are one component now: a facet added here appears on both, and neither can
 * drift from the other.
 */

/**
 * Everything both screens derive from the URL.
 *
 * Filters are URL state, so this is a pure function of `searchParams` plus the
 * products on the page — nothing is held in component state, and a filtered
 * view stays linkable and reloadable.
 *
 * @param {URLSearchParams} searchParams
 * @param {Array<{product: any}>} items Products in the grid, for deriving the
 *   article-type options.
 * @param {{options?: Array<any>, defaultSort?: string}} [config]
 */
export function useListingFilters(searchParams, items, config = {}) {
  const options = config.options ?? SORT_OPTIONS;
  const filters = parseFilters(searchParams);
  const groups = withTypeOptions(items);

  return {
    filters,
    groups,
    chips: getActiveChipsFor(filters, groups),
    activeSort: getSort(
      searchParams.get('sort') ?? config.defaultSort ?? DEFAULT_SORT,
      options,
    ),
    sortOptions: options,
  };
}

/**
 * Filters and sort, as one real form.
 *
 * These used to be links with a decorative `<input type="checkbox">` inside
 * them — which announced an uncheckable checkbox nested in a link, and lied
 * to every screen reader. They are now genuine checkboxes in a GET form, so
 * the control the buyer operates is the control assistive tech reports.
 *
 * Submitting on change keeps the URL as the single source of truth. Every
 * filter lives in this one form, so nothing has to be threaded through hidden
 * inputs, and the pagination cursor is dropped naturally by not being here.
 * Without JavaScript the Apply button submits it.
 *
 * @param {{
 *   filters: Record<string,string[]>,
 *   groups: Array<any>,
 *   sortOptions?: Array<any>,
 *   searchParams: URLSearchParams,
 *   rates: any,
 *   activeSort: any,
 *   sortRef?: any,
 *   idPrefix?: string,
 * }} props
 */
export function FacetForm({
  filters,
  groups,
  sortOptions = SORT_OPTIONS,
  searchParams,
  rates,
  activeSort,
  sortRef,
  idPrefix,
}) {
  const submit = useSubmit();
  const generatedId = useId();
  const sortId = `sort-${idPrefix ?? generatedId}`;
  const query = searchParams.get('q');

  return (
    <Form
      method="get"
      className="facets"
      // Checkboxes are uncontrolled, so remount them whenever the URL changes
      // — otherwise removing a filter via its chip leaves the box still ticked.
      key={searchParams.toString()}
      onChange={(event) =>
        submit(event.currentTarget, {preventScrollReset: true})
      }
    >
      {/* Preserved across a filter change; the cursor deliberately is not.
          On search this carries the term, without which filtering would
          submit back to an empty result set. */}
      {query ? <input type="hidden" name="q" value={query} readOnly /> : null}

      <div className="facets__group">
        <label className="facets__title" htmlFor={sortId}>
          Sort
        </label>
        <div className="sort-control sort-control--panel">
          <select
            id={sortId}
            name="sort"
            ref={sortRef}
            defaultValue={activeSort.value}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.map((group) =>
        // A group whose options were derived and came back empty — article
        // type, when nothing in the grid declares one — is not rendered.
        group.options.length === 0 ? null : (
          <fieldset className="facets__group" key={group.param}>
            <legend className="facets__title">{group.label}</legend>
            <div className="facets__options">
              {group.options.map((option) => {
                const checked = (filters[group.param] ?? []).includes(
                  option.value,
                );
                const label =
                  group.param === 'price' && rates?.currencyCode !== 'INR'
                    ? priceLabelFor(option, rates.currencyCode)
                    : option.label;

                return (
                  <label className="checkbox-row" key={option.value}>
                    <input
                      type="checkbox"
                      name={group.param}
                      value={option.value}
                      defaultChecked={checked}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ),
      )}

      <noscript>
        <button type="submit" className="btn btn--outline facets__apply">
          Apply filters
        </button>
      </noscript>
    </Form>
  );
}

/**
 * The mobile filter/sort bar, its panel, and the applied-filter chips.
 *
 * The facet rail is hidden below 900px, so on a phone both buttons open this
 * one panel; Sort focuses the select inside it rather than merely opening and
 * closing, which used to leave mobile unable to sort at all.
 *
 * @param {{
 *   filters: Record<string,string[]>,
 *   groups: Array<any>,
 *   chips: Array<{param: string, value: string, label: string}>,
 *   sortOptions?: Array<any>,
 *   searchParams: URLSearchParams,
 *   rates: any,
 *   activeSort: any,
 * }} props
 */
export function ListingControls({
  filters,
  groups,
  chips,
  sortOptions,
  searchParams,
  rates,
  activeSort,
}) {
  const [panel, setPanel] = useState(null); // null | 'filter' | 'sort'
  const sortRef = useRef(null);
  const panelId = useId();

  return (
    <>
      <div className="listing-bar">
        <button
          type="button"
          aria-expanded={panel === 'filter'}
          aria-controls={panelId}
          onClick={() => setPanel(panel === 'filter' ? null : 'filter')}
        >
          Filter{chips.length ? ` · ${chips.length}` : ''}
        </button>
        <button
          type="button"
          aria-expanded={panel === 'sort'}
          aria-controls={panelId}
          onClick={() => {
            setPanel(panel === 'sort' ? null : 'sort');
            // Let the panel mount before reaching for the control inside it.
            requestAnimationFrame(() => sortRef.current?.focus());
          }}
        >
          Sort · {activeSort.label}
        </button>
      </div>

      {panel ? (
        <div className="facet-panel" id={panelId}>
          <div className="facet-panel__head">
            <span className="t-label">
              {panel === 'sort' ? 'Sort' : 'Filter'}
            </span>
            <button
              type="button"
              className="facet-panel__close"
              onClick={() => setPanel(null)}
            >
              Done
            </button>
          </div>
          <FacetForm
            filters={filters}
            groups={groups}
            sortOptions={sortOptions}
            searchParams={searchParams}
            rates={rates}
            activeSort={activeSort}
            sortRef={sortRef}
            idPrefix="panel"
          />
        </div>
      ) : null}

      {chips.length ? (
        <div className="applied-filters">
          <span className="applied-filters__label">Filters</span>
          {chips.map((chip) => (
            <Link
              key={`${chip.param}-${chip.value}`}
              className="filter-chip"
              preventScrollReset
              to={`?${toggleFilterSearch(searchParams, chip.param, chip.value)}`}
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <span className="filter-chip__x" aria-hidden="true">
                ×
              </span>
            </Link>
          ))}
          <Link
            className="link-inline"
            preventScrollReset
            to={`?${clearFiltersSearch(searchParams)}`}
          >
            Clear all
          </Link>
        </div>
      ) : null}
    </>
  );
}

/**
 * The price bands are written in rupees in the design. When the storefront is
 * trading in another currency, relabel them with that symbol so the filter
 * never contradicts the prices beside it.
 * @param {{min: number, max: number}} option
 * @param {string} currencyCode
 */
function priceLabelFor(option, currencyCode) {
  if (option.min === 0)
    return `Under ${formatAmount(option.max, currencyCode)}`;
  if (!Number.isFinite(option.max)) {
    return `Above ${formatAmount(option.min, currencyCode)}`;
  }
  return `${formatAmount(option.min, currencyCode)} – ${formatAmount(
    option.max,
    currencyCode,
  )}`;
}
