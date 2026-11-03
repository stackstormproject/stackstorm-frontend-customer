import { Link } from 'react-router-dom';

const BANNERS = [
  {
    id: 'linen',
    title: 'Linen for the heat',
    text: 'Breathable shirts and sarees in washed linen.',
    to: '/shop?search=linen',
    label: 'Shop linen',
  },
  {
    id: 'handloom',
    title: 'Dumbara handloom',
    text: 'Shawls and sarongs in the traditional Dumbara weave.',
    to: '/shop?search=handloom',
    label: 'Shop handloom',
  },
  {
    id: 'gifts',
    title: 'Gifts under LKR 3,000',
    text: 'Sarong sets, shirts and small treats that wrap well.',
    to: '/shop?price=under-3000',
    label: 'Shop gifts',
  },
];

/** Three collection banners under the hero; each is one link. */
export function PromoBanners() {
  return (
    <section className="container promo-banners" aria-label="Collections">
      {BANNERS.map((banner) => (
        <Link key={banner.id} to={banner.to} className={`promo-banner promo-banner--${banner.id}`}>
          <span className="promo-banner__weave" aria-hidden="true" />
          <span className="promo-banner__title">{banner.title}</span>
          <span className="promo-banner__text">{banner.text}</span>
          <span className="promo-banner__cta">{banner.label}</span>
        </Link>
      ))}
    </section>
  );
}
