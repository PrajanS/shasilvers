import {TRUST_ICONS} from '~/components/Icons';
import {TRUST_POINTS} from '~/lib/shop';

/**
 * Hallmark, shipping, buyback, returns. Four facts, stated once, no badges.
 */
export function TrustRow() {
  return (
    <section className="trust-row" aria-label="What every order includes">
      {TRUST_POINTS.map((point) => {
        const Icon = TRUST_ICONS[point.id];
        return (
          <div className="trust-row__item" key={point.id}>
            {Icon ? <Icon /> : null}
            <div>
              <div className="trust-row__title">{point.title}</div>
              <div className="trust-row__detail">{point.detail}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
