import {useState} from 'react';

/**
 * Everything below the fold on a product page is reassurance, not requirement.
 * The accordion keeps it available without letting it push the buy controls
 * off the first screen.
 *
 * @param {{
 *   items: Array<{id: string, label: string, body: React.ReactNode}>,
 *   defaultOpenId?: string|null,
 *   className?: string,
 * }} props
 */
export function Accordion({items, defaultOpenId = null, className = ''}) {
  const [openId, setOpenId] = useState(defaultOpenId);

  return (
    <div className={`accordion ${className}`}>
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `accordion-panel-${item.id}`;
        return (
          <div className="accordion__item" key={item.id}>
            <button
              type="button"
              className="accordion__trigger"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span>{item.label}</span>
              <span className="accordion__sign" aria-hidden="true">
                {open ? '–' : '+'}
              </span>
            </button>
            {open ? (
              <div className="accordion__panel" id={panelId}>
                {item.body}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
