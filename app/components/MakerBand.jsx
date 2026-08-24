import {useId} from 'react';
import {MediaWell} from '~/components/MediaWell';

/**
 * The maker story — the one editorial surface in the system.
 *
 * This is where colour is allowed to own the page rather than annotate it. It
 * carries the claim the whole business rests on (we manufacture, so the
 * making charge is ours to set and the weight on the invoice is the weight
 * you receive), and it breaks the run of neutral panels without ever touching
 * a product tile.
 *
 * @param {{compact?: boolean}} props
 */
export function MakerBand({compact = false}) {
  const headingId = useId();

  return (
    <section className="maker" aria-labelledby={headingId}>
      <div className="maker__inner">
        <div>
          <div className="t-eyebrow">Made by us, not sourced</div>
          <h2 className="t-display-m" id={headingId} style={{marginTop: 14}}>
            Raised from a single sheet, spun and polished in-house
          </h2>
          <p>
            Every article on this site is made in our Coimbatore workshop, sheet
            to spinning lathe to hallmarking.
            {compact
              ? ''
              : ' Because we manufacture, the making charge is ours to set, and the weight on the invoice is the weight you receive.'}
          </p>
        </div>
        <MediaWell
          className="maker__media"
          aspect="16/9"
          note="16:9 · lathe and hands, workshop floor"
        />
      </div>
    </section>
  );
}
