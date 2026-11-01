import diorLogo from '../../assets/brands/dior.webp';
import reebokLogo from '../../assets/brands/reebok.webp';
import filaLogo from '../../assets/brands/fila.webp';
import zaraLogo from '../../assets/brands/zara.webp';
import pumaLogo from '../../assets/brands/puma.webp';
import asicsLogo from '../../assets/brands/asics.webp';
import nikeLogo from '../../assets/brands/nike.webp';
import levisLogo from '../../assets/brands/levis.webp';
import tomsLogo from '../../assets/brands/toms.webp';
import uggLogo from '../../assets/brands/ugg.webp';

const BRANDS = [
  { name: 'Dior', logo: diorLogo },
  { name: 'Reebok', logo: reebokLogo },
  { name: 'Fila', logo: filaLogo },
  { name: 'Zara', logo: zaraLogo },
  { name: 'Puma', logo: pumaLogo },
  { name: 'Asics', logo: asicsLogo },
  { name: 'Nike', logo: nikeLogo },
  { name: "Levi's", logo: levisLogo },
  { name: 'TOMS', logo: tomsLogo },
  { name: 'UGG', logo: uggLogo },
];

/**
 * "Brands we carry": a continuously-scrolling logo strip. The list is rendered twice back to
 * back and the whole track animates left by exactly one copy's width, so the loop is seamless
 * - the viewer never sees a jump or a gap, just an unbroken belt of logos (#8).
 */
export function BrandShelf() {
  return (
    <section className="brand-shelf" aria-labelledby="our-brands">
      <div className="container">
        <h2 id="our-brands">Brands we carry</h2>
      </div>
      <div className="brand-marquee">
        <ul className="brand-marquee__track" aria-label="Brands stocked in store">
          {BRANDS.map((brand) => (
            <li className="brand-marquee__tile" key={brand.name}>
              <img src={brand.logo} alt={brand.name} loading="lazy" />
            </li>
          ))}
          {/* A second, decorative copy so the scroll loops seamlessly; hidden from assistive
              tech so the brand list isn't announced twice. */}
          {BRANDS.map((brand) => (
            <li className="brand-marquee__tile" aria-hidden="true" key={`dup-${brand.name}`}>
              <img src={brand.logo} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
