import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <h1 className="hero__title">Handloom and batik from Dickwella</h1>
        <p className="hero__lede">
          Shirts, sarees and sarongs woven and dyed on the south coast. Delivered islandwide, free
          over LKR 10,000.
        </p>
        <div className="hero__actions">
          <Link to="/shop" className="btn btn--primary">
            Shop the collection
          </Link>
          <Link to="/help/delivery" className="btn btn--ghost">
            Delivery details
          </Link>
        </div>
      </div>
      <div className="warp-stripe warp-stripe--wide" aria-hidden="true" />
    </section>
  );
}
