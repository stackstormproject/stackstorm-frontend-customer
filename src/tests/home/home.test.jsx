import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeroCarousel, HERO_SLIDES } from '../../components/home/HeroCarousel';
import { PromoBanners } from '../../components/home/PromoBanners';
import { SiteFooter } from '../../components/layout/SiteFooter';
import { UtilityBar } from '../../components/layout/SiteHeader';

// Refs #175: storefront header, animated banners and footer.
const renderIn = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);
const activeTitle = () =>
  screen
    .getAllByRole('group', { hidden: true })
    .find((slide) => !slide.hasAttribute('inert'))
    .querySelector('h2').textContent;

describe('HeroCarousel', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete window.matchMedia;
  });

  it('should show the first banner with its link and keep the others out of reach', () => {
    renderIn(<HeroCarousel />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Handloom and batik/);
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
    expect(screen.getByRole('link', { name: "Shop men's batik" })).toHaveAttribute(
      'href',
      '/shop/men'
    );
    expect(screen.queryByRole('link', { name: 'Shop sarees' })).not.toBeInTheDocument();
  });

  it('should advance every seven seconds and wrap around', () => {
    vi.useFakeTimers();
    renderIn(<HeroCarousel />);

    act(() => vi.advanceTimersByTime(7000));
    expect(activeTitle()).toBe(HERO_SLIDES[1].title);
    act(() => vi.advanceTimersByTime(7000));
    act(() => vi.advanceTimersByTime(7000));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
  });

  it('should move with the arrows and the dots', () => {
    renderIn(<HeroCarousel />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous banner' }));
    expect(activeTitle()).toBe(HERO_SLIDES[2].title);
    fireEvent.click(screen.getByRole('button', { name: 'Next banner' }));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
    fireEvent.click(screen.getByRole('button', { name: /Show banner 2/ }));
    expect(activeTitle()).toBe(HERO_SLIDES[1].title);
    expect(screen.getByRole('button', { name: /Show banner 2/ })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('should stop while paused, hovered or focused', () => {
    vi.useFakeTimers();
    renderIn(<HeroCarousel />);
    const carousel = screen.getByRole('region', { name: 'Featured collections' });

    fireEvent.click(screen.getByRole('button', { name: 'Pause banners' }));
    act(() => vi.advanceTimersByTime(20000));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);

    fireEvent.click(screen.getByRole('button', { name: 'Play banners' }));
    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(20000));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
    fireEvent.mouseLeave(carousel);

    fireEvent.focus(screen.getByRole('button', { name: 'Next banner' }));
    act(() => vi.advanceTimersByTime(20000));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
    fireEvent.blur(screen.getByRole('button', { name: 'Next banner' }));
    act(() => vi.advanceTimersByTime(7000));
    expect(activeTitle()).toBe(HERO_SLIDES[1].title);
  });

  it('should not rotate on its own for shoppers who prefer reduced motion', () => {
    vi.useFakeTimers();
    window.matchMedia = () => ({ matches: true });
    renderIn(<HeroCarousel />);

    act(() => vi.advanceTimersByTime(20000));
    expect(activeTitle()).toBe(HERO_SLIDES[0].title);
    expect(screen.getByRole('button', { name: 'Play banners' })).toBeInTheDocument();
  });

  it('should hide the controls for a single banner', () => {
    renderIn(<HeroCarousel slides={[HERO_SLIDES[0]]} />);

    expect(screen.queryByRole('button', { name: 'Next banner' })).not.toBeInTheDocument();
  });

  // Refs #200: admin-managed banners replace the default slide in the matching slot.
  it('should replace a slide with the admin banner in its slot, by image', () => {
    const { container } = renderIn(
      <HeroCarousel
        banners={[
          { slot: 2, title: 'Monsoon sale', subtitle: 'Up to 40% off', image_url: '/b2.jpg' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Show banner 2/ }));
    expect(activeTitle()).toBe('Monsoon sale');
    expect(screen.getByText('Up to 40% off')).toBeInTheDocument();
    expect(container.querySelector('.hero-slide__art img')).toHaveAttribute('src', '/b2.jpg');
  });

  it('should keep the default slide for a slot with no banner, and the default link with no button fields', () => {
    renderIn(<HeroCarousel banners={[{ slot: 1, title: 'No link here', image_url: '/b1.jpg' }]} />);

    expect(activeTitle()).toBe('No link here');
    expect(screen.getByRole('link', { name: "Shop men's batik" })).toHaveAttribute(
      'href',
      '/shop/men'
    );
    fireEvent.click(screen.getByRole('button', { name: /Show banner 2/ }));
    expect(activeTitle()).toBe(HERO_SLIDES[1].title);
  });
});

describe('PromoBanners', () => {
  it('should link three collections', () => {
    renderIn(<PromoBanners />);

    const links = within(screen.getByRole('region', { name: 'Collections' })).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[2]).toHaveAttribute('href', '/shop?price=under-3000');
  });
});

describe('Header and footer', () => {
  it('should state the delivery promise and the shop address', () => {
    renderIn(<UtilityBar />);

    expect(screen.getByText(/Free islandwide delivery over LKR 10,000/)).toBeInTheDocument();
    expect(screen.getByText(/Main Street, Dickwella/)).toBeInTheDocument();
  });

  it('should list the promises, shop and help links and the address', () => {
    renderIn(<SiteFooter />);

    expect(screen.getByRole('region', { name: 'Our promises' })).toHaveTextContent(
      'Returns within 30 days'
    );
    expect(
      within(screen.getByRole('navigation', { name: 'Shop' })).getByRole('link', { name: 'Kids' })
    ).toHaveAttribute('href', '/shop/kids');
    expect(
      within(screen.getByRole('navigation', { name: 'Help' })).getByRole('link', {
        name: 'Track an order',
      })
    ).toHaveAttribute('href', '/account/orders');
    expect(screen.getByRole('link', { name: 'Open the map' })).toHaveAttribute('target', '_blank');
  });
});
