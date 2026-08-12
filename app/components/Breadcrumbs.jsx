import {Link} from 'react-router';

/**
 * Breadcrumbs as an ordered list, which is what they are — a sequence, not a
 * run of links with slashes between them. The separator is drawn in CSS so it
 * is never read aloud.
 *
 * @param {{trail: Array<{label: string, to?: string}>}} props
 */
export function Breadcrumbs({trail}) {
  if (!trail?.length) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.to ?? crumb.label}>
              {crumb.to && !isLast ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span className="breadcrumbs__current" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
