import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { BatikShirtArt, FestivalSarongArt, SareeLoomArt } from './BannerArt';

export const HERO_SLIDES = [
  {
    id: 'batik',
    title: 'Batik shirts, waxed and dyed by hand',
    text: 'Linen and cotton shirts in indigo and ochre. Every pattern is drawn in wax at our Dickwella workshop, so no two are quite the same.',
    action: { label: "Shop men's batik", to: '/shop/men' },
    Art: BatikShirtArt,
  },
  {
    id: 'saree',
    title: 'Sarees with a woven gold border',
    text: 'Handloom cotton and fine linen in one free size, finished with a zari border. Delivered islandwide, free over LKR 10,000.',
    action: { label: 'Shop sarees', to: '/shop/women' },
    Art: SareeLoomArt,
  },
  {
    id: 'festival',
    title: 'Festival sets for little ones',
    text: 'Sarong sets and kurtis for Avurudu, weddings and temple days, in sizes that fit from toddlers up.',
    action: { label: "Shop kids' sets", to: '/shop/kids' },
    Art: FestivalSarongArt,
  },
];

const ADVANCE_MS = 7000;
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Three banners that advance every 7 seconds. Rotation stops while the pointer or keyboard
 * focus is inside, when the shopper presses pause, and never starts with reduced motion.
 */
export function HeroCarousel({ slides = HERO_SLIDES }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(reducedMotion);
  const [holding, setHolding] = useState(false);
  const count = slides.length;

  const go = useCallback((next) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (paused || holding || count < 2) return undefined;
    const timer = setTimeout(() => go(index + 1), ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, holding, count, go]);

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHolding(false);
      }}
    >
      <h1 className="visually-hidden">Handloom and batik from Dickwella</h1>
      <div className="hero-carousel__track">
        {slides.map(({ id, title, text, action, Art }, i) => {
          const active = i === index;
          return (
            <div
              key={id}
              className={`hero-slide hero-slide--${id} ${active ? 'is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="container hero-slide__inner">
                <div className="hero-slide__copy">
                  <h2 className="hero-slide__title">{title}</h2>
                  <p className="hero-slide__text">{text}</p>
                  <div className="hero-slide__actions">
                    <Link to={action.to} className="btn btn--gold">
                      {action.label}
                    </Link>
                    <Link to="/shop" className="btn btn--on-dark">
                      Browse everything
                    </Link>
                  </div>
                </div>
                <div className="hero-slide__art">
                  <Art />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="container hero-carousel__controls">
          <button
            type="button"
            className="hero-carousel__button"
            aria-label="Previous banner"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="hero-carousel__dots">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-carousel__dot ${i === index ? 'is-active' : ''}`}
                aria-label={`Show banner ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="hero-carousel__button"
            aria-label="Next banner"
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-carousel__button"
            aria-label={paused ? 'Play banners' : 'Pause banners'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Pause size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      )}
      <div className="warp-stripe warp-stripe--wide" aria-hidden="true" />
    </section>
  );
}
