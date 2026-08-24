import {Link} from 'react-router';
import {SHOP} from '~/lib/shop';
import {useCollections, useCollectionPath} from '~/lib/collections';

const HELP_LINKS = [
  {label: 'Track order', to: '/account/orders'},
  {label: 'Shipping', to: '/policies/shipping-policy'},
  {label: 'Returns', to: '/policies/refund-policy'},
  {label: 'Buyback', to: '/pages/buyback'},
  {label: 'Contact', to: '/pages/contact'},
];

/** @param {string} bulkPath */
const aboutLinks = (bulkPath) => [
  {label: 'The workshop', to: '/pages/workshop'},
  {label: 'Hallmarking', to: '/pages/hallmarking'},
  {label: 'Bulk orders', to: bulkPath},
  {label: 'Terms', to: '/policies/terms-of-service'},
];

const PAYMENT_METHODS = ['UPI', 'Cards', 'Net banking'];

export function Footer() {
  const collections = useCollections();
  const aboutLinkList = aboutLinks(
    useCollectionPath('bulk-and-corporate', 'bulk-corporate'),
  );
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <div className="site-footer__brand">{SHOP.name}</div>
          <p>
            Manufacturers of 925 sterling silverware. {SHOP.city}, {SHOP.region}
            . GSTIN {SHOP.gstin}.
          </p>
        </div>

        <div className="footer-col">
          <h2 className="footer-col__title">Shop</h2>
          {collections.slice(0, 5).map((collection) => (
            <Link key={collection.id} to={`/collections/${collection.handle}`}>
              {collection.title}
            </Link>
          ))}
        </div>

        <div className="footer-col">
          <h2 className="footer-col__title">Help</h2>
          {HELP_LINKS.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-col">
          <h2 className="footer-col__title">About</h2>
          {aboutLinkList.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h2 className="footer-col__title">Order on WhatsApp</h2>
          <p>
            {SHOP.whatsapp}
            <br />
            {SHOP.whatsappHours}
          </p>
          <div className="footer-pay">
            {PAYMENT_METHODS.map((method) => (
              <span key={method}>{method}</span>
            ))}
          </div>
        </div>

        <div className="site-footer__legal">
          <span>
            © {year} {SHOP.name}
          </span>
          <span>Priced at the day’s metal rate · revised daily at 9 AM</span>
        </div>
      </div>
    </footer>
  );
}
