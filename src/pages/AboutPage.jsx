import { Link } from 'react-router-dom';
import { Hand, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { BrandMark } from '../components/layout/BrandMark';

// #192 (FR-33): a short, honest "About us" page for the shop.
const VALUES = [
  {
    Icon: Hand,
    title: 'Made on the south coast',
    text: 'Every batik and handloom piece is woven, dyed and sewn in Dickwella, Matara, by people we know by name.',
  },
  {
    Icon: Truck,
    title: 'Islandwide delivery',
    text: 'Free on orders of LKR 10,000 or more, and always available for collection in store.',
  },
  {
    Icon: RotateCcw,
    title: 'Easy returns',
    text: 'Exchange a size or ask for a refund within 30 days of delivery.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure payment',
    text: 'Card details are handled by our payment provider and never touch our own servers.',
  },
];

export default function AboutPage() {
  return (
    <article className="container page about-page">
      <header className="about-page__intro">
        <p className="about-page__brand">
          <BrandMark size={40} />
        </p>
        <h1>About Dickwella Fashion Corner</h1>
        <p className="about-page__lead">
          We are a family shop on Main Street, Dickwella, selling batik, handloom and linen clothing
          woven and dyed on Sri Lanka&rsquo;s south coast. What started as a single loom has grown
          into a small team of weavers, dyers and tailors, and this shop so our work can reach
          customers beyond Dickwella.
        </p>
        <p>
          Every piece we sell is made close to home, using traditional batik and handloom techniques
          passed down through generations, alongside modern cuts and finishes that fit everyday
          life.
        </p>
      </header>

      <ul className="about-page__values">
        {VALUES.map(({ Icon, title, text }) => (
          <li key={title} className="about-page__value">
            <span className="about-page__value-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="about-page__visit" aria-labelledby="about-visit-heading">
        <h2 id="about-visit-heading">Visit the shop</h2>
        <address>
          Main Street, Dickwella, Matara 81200
          <br />
          Open daily, 9 am to 8 pm
        </address>
        <p>
          <Link to="/shop">Shop our collection</Link> or{' '}
          <Link to="/help/delivery">read about delivery and collection</Link>.
        </p>
      </section>
    </article>
  );
}
