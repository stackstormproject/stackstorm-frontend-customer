import { listBrands, listProducts } from '../api/catalog';
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
  const brands = useResource(listBrands, []);

  return (
    <>
      <HeroCarousel />
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
      <BrandShelf brands={Array.isArray(brands.data) ? brands.data : []} />
    </>
  );
}
