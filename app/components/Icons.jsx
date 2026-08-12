/**
 * Line icons.
 *
 * Every icon is a 1px (or thinner) stroke on `currentColor`, matching the
 * hairline weight of the rest of the system. No fills, no two-tone marks.
 */

/** @param {{size?: number, className?: string}} props */
export function SearchIcon({size = 15, className}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
      className={className}
    >
      <circle cx="7" cy="7" r="5" />
      <line x1="10.6" y1="10.6" x2="14" y2="14" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function BagIcon({size = 14}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M3 4.5h10l-1 8H4z" />
      <path d="M6 4.5a2 2 0 0 1 4 0" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function LockIcon({size = 13}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden="true"
    >
      <rect x="3.5" y="7" width="9" height="6.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function CheckCircleIcon({size = 34}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <circle cx="17" cy="17" r="15" />
      <polyline points="11,17.5 15.5,22 23,13" />
    </svg>
  );
}

/** The hallmark stamp. @param {{size?: number}} props */
export function HallmarkIcon({size = 20}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <circle cx="11" cy="11" r="3.4" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function TruckIcon({size = 20}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="11" height="9" />
      <path d="M14 9h3.5L19 12v3h-5z" />
      <circle cx="7" cy="16" r="1.6" />
      <circle cx="16" cy="16" r="1.6" />
    </svg>
  );
}

/** Buyback — a return arrow. @param {{size?: number}} props */
export function BuybackIcon({size = 20}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      <path d="M18 6.5A8 8 0 1 0 19 11" />
      <polyline points="19,3 19,7 15,7" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function ReturnsIcon({size = 20}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="16" height="14" />
      <line x1="3" y1="9" x2="19" y2="9" />
    </svg>
  );
}

export const TRUST_ICONS = {
  hallmark: HallmarkIcon,
  shipping: TruckIcon,
  buyback: BuybackIcon,
  returns: ReturnsIcon,
};
