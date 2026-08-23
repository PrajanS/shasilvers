import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A drawer that behaves like a real dialog.
 *
 * The panel stays mounted so its contents can animate, which means when it is
 * closed it must be genuinely inert: hidden from assistive technology and out
 * of the tab order. Otherwise a keyboard user tabs off the header and lands
 * inside an invisible bag.
 *
 * While open it traps focus, returns focus to whatever opened it, and closes
 * on Escape.
 *
 * @param {{
 *   children?: React.ReactNode;
 *   type: AsideType;
 *   heading: React.ReactNode;
 * }} props
 */
export function Aside({children, heading, type}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const returnFocusRef = useRef(null);

  // `inert` removes the closed drawer from the tab order and the a11y tree.
  // Applied imperatively because React only recognises it as a prop from v19,
  // and this project runs React 18.
  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return;
    if (expanded) node.removeAttribute('inert');
    else node.setAttribute('inert', '');
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return undefined;

    // Remember what to give focus back to when the drawer closes.
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const panel = panelRef.current;
    const abortController = new AbortController();
    const {signal} = abortController;

    // Move focus into the drawer so the next Tab stays inside it.
    const first = panel?.querySelector(FOCUSABLE);
    (first instanceof HTMLElement ? first : panel)?.focus();

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          close();
          return;
        }
        if (event.key !== 'Tab' || !panel) return;

        const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(
          (el) => el.offsetParent !== null,
        );
        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      },
      {signal},
    );

    // The page behind must not scroll while the drawer is over it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      abortController.abort();
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [close, expanded]);

  return (
    <div
      ref={overlayRef}
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
      aria-modal={expanded ? 'true' : undefined}
      aria-labelledby={id}
      // Closed: invisible to assistive tech and out of the tab order.
      aria-hidden={expanded ? undefined : 'true'}
    >
      <button
        className="close-outside"
        onClick={close}
        aria-label="Close"
        tabIndex={-1}
      />
      <aside ref={panelRef} tabIndex={-1}>
        <header>
          <h2 id={id}>{heading}</h2>
          <button className="close reset" onClick={close} aria-label="Close">
            &times;
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext(null);

Aside.Provider = function AsideProvider({children}) {
  const [type, setType] = useState('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}

/** @typedef {'search' | 'cart' | 'mobile' | 'closed'} AsideType */
