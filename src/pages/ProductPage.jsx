import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import { Gallery } from '../components/product/Gallery';
import { BuyBox } from '../components/product/BuyBox';
import { Reviews } from '../components/product/Reviews';
import { LoadingState, ErrorState } from '../components/ui/States';
import NotFoundPage from './NotFoundPage';

const imageUrlsOf = (product) => {
  const urls = (product.images || []).map((img) => img.imageUrl || img.image_url).filter(Boolean);
  if (!urls.length && product.primary_image) urls.push(product.primary_image);
  return [...new Set(urls)];
};

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, error, loading, reload } = useResource(() => getProduct(slug), [slug]);

  useEffect(() => {
    if (product) document.title = `${product.name} | Dickwella Fashion Corner`;
  }, [product]);

  if (loading) return <LoadingState label="Loading product" />;
  if (error?.status === 404) return <NotFoundPage />;
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const category =
    product.category && typeof product.category === 'object' ? product.category : null;

  return (
    <div className="container page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li>
            <Link to="/shop">Shop</Link>
          </li>
          {category && (
            <li>
              <Link to={`/shop/${category.slug}`}>{category.name}</Link>
            </li>
          )}
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="product">
        <Gallery images={imageUrlsOf(product)} name={product.name} />
        <div className="product__info">
          <h1>{product.name}</h1>
          {product.brand && <p className="product__brand">{product.brand}</p>}
          <BuyBox key={product.id} product={product} />
          {product.is_final_sale && (
            <p className="product__notice">
              Final sale: this item cannot be returned or exchanged.
            </p>
          )}
          <dl className="product__details">
            {product.description && (
              <>
                <dt>About</dt>
                <dd>{product.description}</dd>
              </>
            )}
            {product.material && (
              <>
                <dt>Material</dt>
                <dd>{product.material}</dd>
              </>
            )}
            {product.care_instructions && (
              <>
                <dt>Care</dt>
                <dd>{product.care_instructions}</dd>
              </>
            )}
            <dt>Delivery</dt>
            <dd>
              LKR 450 islandwide, free over LKR 10,000, or collect from the shop.{' '}
              <Link to="/help/delivery">Details</Link>
            </dd>
          </dl>
        </div>
      </div>

      <Reviews productId={product.id} slug={product.slug} />
    </div>
  );
}
