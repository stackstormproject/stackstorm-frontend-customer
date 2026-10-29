import { Link } from 'react-router-dom';
import { Price } from '../ui/Price';
import { StockBadge } from '../ui/StockBadge';
import { WishlistButton } from './WishlistButton';
import { QuickBuy } from './QuickBuy';
import { productAvailability } from '../../lib/stock';
import { sortSizes } from '../../lib/catalogQuery';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><rect width="4" height="5" fill="%23e2e8f0"/></svg>';

export function ProductCard({ product }) {
  const available = productAvailability(product);
  const sizes = sortSizes((product.variants || []).map((v) => v.size));
  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card__link">
        <div className="product-card__media">
          <img
            src={product.primary_image || PLACEHOLDER_IMAGE}
            alt=""
            loading="lazy"
            onError={(event) => {
              // eslint-disable-next-line no-param-reassign
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
          {product.gallery_images?.[0] && (
            <img
              className="product-card__alt"
              src={product.gallery_images[0]}
              alt=""
              loading="lazy"
              onError={(event) => event.currentTarget.remove()}
            />
          )}
          {product.is_on_sale && (
            <span className="product-card__badge product-card__badge--sale">Sale</span>
          )}
          {!product.is_on_sale && product.is_new_arrival && (
            <span className="product-card__badge">New</span>
          )}
        </div>
        <h3 className="product-card__name">{product.name}</h3>
      </Link>
      <div className="product-card__meta">
        {product.is_on_sale ? (
          <span className="product-card__price-row">
            <Price amount={product.sale_price} className="price--sale" />
            <Price amount={product.price} className="price--was" />
          </span>
        ) : (
          <Price amount={product.price} />
        )}
        <StockBadge available={available} />
      </div>
      {sizes.length > 0 && <p className="product-card__sizes">{sizes.join(', ')}</p>}
      <QuickBuy product={product} />
      <WishlistButton productId={product.id} productName={product.name} />
    </article>
  );
}
