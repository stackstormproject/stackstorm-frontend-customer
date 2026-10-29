import { listBanners, listBrands, listProducts } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { PromoBanners } from '../components/home/PromoBanners';
import { ProductRail } from '../components/home/ProductRail';
import { BrandShelf } from '../components/home/BrandShelf';

const SECTION_SIZE = 8;

/** New arrivals chosen by staff; the newest products until staff have chosen any. */
const loadNewArrivals = async () => {
  const chosen = await listProducts({ section: 'new_arrivals', limit: SECTION_SIZE });
  if (chosen?.products?.length) return chosen;
  return listProducts({ sort: 'newest', limit: SECTION_SIZE });
};

export default function HomePage() {
  const newArrivals = useResource(loadNewArrivals, []);
  const popular = useResource(() => listProducts({ section: 'popular', limit: SECTION_SIZE }), []);
  const sale = useResource(() => listProducts({ section: 'sale', limit: SECTION_SIZE }), []);
  const brands = useResource(listBrands, []);
  // Admin-managed hero banners, by slot (#200); a slot admin hasn't filled in yet keeps the
  // default hardcoded slide, so a fetch failure or empty response never hides the hero.
  const banners = useResource(listBanners, []);

  return (
    <>
      <HeroCarousel banners={Array.isArray(banners.data) ? banners.data : []} />
      <PromoBanners />
      <ProductRail
        id="new-in"
        title="New arrivals"
        intro="Fresh from the looms and dye vats this season."
        link={{ to: '/shop?sort=newest', label: 'See everything new' }}
        resource={newArrivals}
        products={newArrivals.data?.products || []}
      />
      <ProductRail
        id="popular"
        title="Popular now"
        intro="What shoppers in Dickwella and beyond are buying."
        link={{ to: '/shop', label: 'Browse the shop' }}
        resource={popular}
        products={popular.data?.products || []}
      />
      <ProductRail
        id="sale"
        title="Sale"
        intro="Discounted pieces while they last."
        link={{ to: '/sale', label: 'Browse sale' }}
        resource={sale}
        products={sale.data?.products || []}
      />
      <BrandShelf brands={Array.isArray(brands.data) ? brands.data : []} />
    </>
  );
}
