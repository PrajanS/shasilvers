import {Link} from 'react-router';

/**
 * The four buttons in the system.
 *
 *   primary   — one per screen, Deep moss. Add to bag, Checkout, Pay.
 *   secondary — outlined Ink. Buy now, Track order.
 *   quickadd  — solid Ink, appears over a tile on hover.
 *   outline   — hairline on Paper. Load more, Apply, tertiary actions.
 *
 * Renders an <a> when given `to` or `href`, a <button> otherwise, so a link
 * is never faked with a click handler.
 *
 * @param {{
 *   variant?: 'primary'|'secondary'|'quickadd'|'outline',
 *   to?: string,
 *   href?: string,
 *   block?: boolean,
 *   className?: string,
 *   children: React.ReactNode,
 *   [key: string]: any,
 * }} props
 */
export function Button({
  variant = 'primary',
  to,
  href,
  block = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
