import React from 'react';
import {
  Sparkles,
  ArrowLeft,
  Compass,
  Heart,
  ShieldCheck,
  Award,
  Sun,
  Layers,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import './BrandStoryPage.css';

/**
 * BrandStoryPage Component
 * Celebrating the craft heritage of Dickwella Fashion Corner & StackStorm.
 * Features Southern Province handloom weaving traditions, wax-resist batik atelier,
 * and sustainable artisanal empowerment in Matara, Sri Lanka.
 */
export function BrandStoryPage({ onBackToCatalog }) {
  return (
    <article className="brand-story-page" data-testid="brand-story-page">
      {/* 1. Immersive Hero Banner */}
      <section className="brand-story__hero">
        <div className="container">
          <div className="brand-story__hero-nav">
            <button
              type="button"
              className="brand-story__back-btn"
              onClick={onBackToCatalog}
              data-testid="brand-story-back-btn"
            >
              <ArrowLeft size={16} />
              <span>Back to Collections</span>
            </button>
            <span className="brand-story__location-tag">
              <MapPin size={13} color="#D4AF37" />
              Main Street, Dickwella, Matara • Southern Province
            </span>
          </div>

          <div className="brand-story__hero-content">
            <div className="brand-story__badge">
              <Sparkles size={14} color="#D4AF37" />
              <span>The Living Atelier of Southern Sri Lanka</span>
            </div>
            <h1 className="brand-story__hero-title">
              Woven in the Coastal Breeze of <span className="gold-gradient-text">Dickwella</span>
            </h1>
            <p className="brand-story__hero-subtitle">
              Every thread tells a story of ocean tides, ancient wooden looms, and hot beeswax drawn
              by hand. Discover the enduring craft behind Dickwella Fashion Corner and StackStorm.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Key Pillars / Statistics */}
      <section className="brand-story__stats-section">
        <div className="container">
          <div className="brand-story__stats-grid">
            <div className="brand-stat-card">
              <div className="brand-stat-number">1988</div>
              <div className="brand-stat-title">Heritage Roots</div>
              <p className="brand-stat-desc">
                Over three decades of textile mastery originating in the heart of Dickwella, Matara.
              </p>
            </div>
            <div className="brand-stat-card">
              <div className="brand-stat-number">100%</div>
              <div className="brand-stat-title">Natural Organic Fibers</div>
              <p className="brand-stat-desc">
                Pure breathable linen and organic cotton loomed for tropical coastal comfort.
              </p>
            </div>
            <div className="brand-stat-card">
              <div className="brand-stat-number">50+</div>
              <div className="brand-stat-title">Master Artisan Weavers</div>
              <p className="brand-stat-desc">
                Sustaining generational weaving families across the Southern Province.
              </p>
            </div>
            <div className="brand-stat-card">
              <div className="brand-stat-number">0%</div>
              <div className="brand-stat-title">Synthetic Microplastics</div>
              <p className="brand-stat-desc">
                Biodegradable dyes and plant-based textiles that respect our Indian Ocean coastline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Deep Narrative: Chapters */}
      <section className="brand-story__narrative">
        <div className="container">
          {/* Chapter 1 */}
          <div className="narrative-chapter">
            <div className="narrative-chapter__content">
              <div className="narrative-chapter__tag">Chapter 01</div>
              <h2 className="narrative-chapter__title">
                The Wooden Loom & The Rhythms of the South
              </h2>
              <p>
                Before dawn breaks over Dickwella’s golden beaches, the gentle clatter of wooden
                shuttles echoes through our family-run workshops. Unlike mass-manufactured fast
                fashion, true Sri Lankan handloom is a slow, meditative art where the rhythm of the
                artisan’s foot pedal dictates the tension and softness of each weave.
              </p>
              <p>
                Our weavers use pure combed cotton and sustainable linen fibers, spinning them with
                balanced tension that breathes effortlessly in tropical heat while preserving its
                heirloom durability for decades.
              </p>
              <div className="narrative-highlight">
                <CheckCircle size={18} color="#D4AF37" />
                <span>Zero motorized machinery used in our pure handloom collections.</span>
              </div>
            </div>
            <div className="narrative-chapter__card">
              <div className="chapter-art-box">
                <Layers size={48} color="#D4AF37" />
                <h3>Traditional Pit & Frame Looms</h3>
                <p>
                  Each handloom saree and sarong requires up to 72 hours of uninterrupted
                  craftsmanship on heritage Southern Sri Lankan looms.
                </p>
              </div>
            </div>
          </div>

          {/* Chapter 2 */}
          <div className="narrative-chapter narrative-chapter--reversed">
            <div className="narrative-chapter__content">
              <div className="narrative-chapter__tag">Chapter 02</div>
              <h2 className="narrative-chapter__title">The Alchemy of Wax-Resist Batik</h2>
              <p>
                Our signature batik collections represent a centuries-old dialogue between flame,
                wax, and dye. Each shirt, tunic, and drape begins with raw unbleached fabric pinned
                taut across wooden frames. Using a <em>tjanting</em> copper pen and heated natural
                beeswax, master artisans trace intricate geometric and island flora motifs directly
                onto the cloth.
              </p>
              <p>
                Immersed in cold-water dye baths and cured under the Southern sun, the waxed
                patterns resist the dye, creating the distinctive crackled veins and vibrant color
                saturations that make every single garment an unrepeatable work of art.
              </p>
              <div className="narrative-highlight">
                <CheckCircle size={18} color="#D4AF37" />
                <span>Hand-poured beeswax batik patterns—no automated screen printing.</span>
              </div>
            </div>
            <div className="narrative-chapter__card">
              <div className="chapter-art-box">
                <Sun size={48} color="#D4AF37" />
                <h3>Sun-Cured Under the Dickwella Sky</h3>
                <p>
                  Natural sea breezes and southern sunlight naturally fix our pigments, yielding
                  vibrant hues of ocean cobalt, turmeric gold, and deep charcoal.
                </p>
              </div>
            </div>
          </div>

          {/* Chapter 3 */}
          <div className="narrative-chapter">
            <div className="narrative-chapter__content">
              <div className="narrative-chapter__tag">Chapter 03</div>
              <h2 className="narrative-chapter__title">Empowering Local Weaving Families</h2>
              <p>
                Dickwella Fashion Corner was founded on a simple promise: that modern e-commerce
                should uplift, not displace, traditional artisans. Through the StackStorm digital
                platform, we connect our Southern Province ateliers directly with customers across
                Sri Lanka and the global diaspora.
              </p>
              <p>
                More than 70% of our master weavers and batik craftswomen are women running home
                ateliers, earning fair living wages that support rural households, university
                education, and community well-being.
              </p>
              <div className="narrative-highlight">
                <CheckCircle size={18} color="#D4AF37" />
                <span>100% fair trade compensation direct to local rural artisan households.</span>
              </div>
            </div>
            <div className="narrative-chapter__card">
              <div className="chapter-art-box">
                <Heart size={48} color="#E11D48" />
                <h3>Fair-Trade Social Impact</h3>
                <p>
                  Every purchase directly funds artisan apprenticeships, keeping Sri Lanka’s
                  UNESCO-recognized craft heritage vibrant for the next generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 4-Step Craft Journey */}
      <section className="brand-story__process-section">
        <div className="container">
          <div className="brand-story__section-header">
            <h2 className="brand-story__section-title">The 4-Stage Artisan Journey</h2>
            <p className="brand-story__section-subtitle">
              From raw organic fiber to your doorstep across Sri Lanka.
            </p>
          </div>

          <div className="brand-process-grid">
            <div className="brand-process-step">
              <div className="step-number">01</div>
              <h4>Organic Fiber Selection</h4>
              <p>
                Sourcing combed natural cotton and linen grown without synthetic micro-plastics.
              </p>
            </div>
            <div className="brand-process-step">
              <div className="step-number">02</div>
              <h4>Heritage Hand Looming</h4>
              <p>
                Woven thread-by-thread on traditional wooden frame looms by Dickwella craft masters.
              </p>
            </div>
            <div className="brand-process-step">
              <div className="step-number">03</div>
              <h4>Wax Batik & Cold Dyeing</h4>
              <p>
                Intricate wax drawing with copper pens followed by multi-layered natural pigment
                baths.
              </p>
            </div>
            <div className="brand-process-step">
              <div className="step-number">04</div>
              <h4>Sun Curing & Tailoring</h4>
              <p>
                Solar-dried by the Indian Ocean breeze and tailored into modern luxury resort wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call to Action */}
      <section className="brand-story__cta-section">
        <div className="container">
          <div className="brand-cta-box">
            <h2>Wear the Heritage of Sri Lanka</h2>
            <p>
              Explore our handcrafted collections of men’s batik shirts, pure handloom sarees, and
              breathable organic linen apparel.
            </p>
            <button
              type="button"
              className="btn-primary brand-cta-btn"
              onClick={onBackToCatalog}
              data-testid="brand-story-cta-btn"
            >
              <span>Explore The Collections</span>
              <Sparkles size={18} />
            </button>
          </div>
        </div>
      </section>
    </article>
  );
}
export default BrandStoryPage;
