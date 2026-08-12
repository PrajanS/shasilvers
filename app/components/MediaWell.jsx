import {Image} from '@shopify/hydrogen';

/**
 * An image well.
 *
 * Product photography for this catalogue is shot 1:1 on sand. Until an image
 * exists, the well renders the crop note from the design rather than a broken
 * image or an empty box — the layout holds its shape either way.
 *
 * @param {{
 *   data?: any,
 *   note?: string,
 *   aspect?: string,
 *   sizes?: string,
 *   loading?: 'eager'|'lazy',
 *   className?: string,
 * }} props
 */
export function MediaWell({
  data,
  note = '1:1',
  aspect = '1/1',
  sizes = '(min-width: 901px) 25vw, 50vw',
  loading,
  className = '',
}) {
  const classes = ['media', aspect === '1/1' ? 'media--square' : '', className]
    .filter(Boolean)
    .join(' ');

  if (data?.url) {
    return (
      <div className={classes} style={aspect !== '1/1' ? {aspectRatio: aspect} : undefined}>
        <Image
          alt={data.altText || ''}
          aspectRatio={aspect}
          data={data}
          sizes={sizes}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={aspect !== '1/1' ? {aspectRatio: aspect} : undefined}
    >
      <span className="media__note">{note}</span>
    </div>
  );
}
