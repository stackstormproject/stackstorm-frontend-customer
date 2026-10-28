import { apiClient } from './client';

let inMemoryCategoryCache = null;

export const DEFAULT_FALLBACK_CATEGORIES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Men',
    slug: 'men',
    description:
      "Men's clothing, batik shirts, formal wear, and accessories tailored in Sri Lanka.",
    featuredImage:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    tagline: 'Signature Handloom & Southern Batik',
    children: [
      {
        id: 'a0000000-0000-0000-0000-000000000011',
        name: 'Batik Shirts',
        slug: 'men-batik-shirts',
        description: 'Authentic Sri Lankan hand-crafted batik shirts.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000014',
        name: 'Linen Casual Shirts',
        slug: 'men-linen-casual-shirts',
        description: 'Breathable washed linen shirts.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000012',
        name: 'Formal Trousers',
        slug: 'men-formal-trousers',
        description: 'Expertly tailored executive trousers.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000013',
        name: 'Casual Tees & Polos',
        slug: 'men-casual-tees-polos',
        description: '100% combed cotton crew necks.',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Women',
    slug: 'women',
    description: "Women's designer silk saris, linen dresses, kurtis, and modern everyday wear.",
    featuredImage:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    tagline: 'Pure Kandyan Silk & Handloom Sarees',
    children: [
      {
        id: 'a0000000-0000-0000-0000-000000000021',
        name: 'Silk Saris',
        slug: 'women-silk-saris',
        description: 'Handwoven Kandyan silk saris.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000022',
        name: 'Linen Dresses',
        slug: 'women-linen-dresses',
        description: 'Flowy midi dresses in washed linen.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000024',
        name: 'Traditional Kurtis',
        slug: 'women-traditional-kurtis',
        description: 'Embroidered festive tunics and kurtis.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000023',
        name: 'Blouses & Tops',
        slug: 'women-blouses-tops',
        description: 'Block-printed tops and blouses.',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Kids',
    slug: 'kids',
    description: 'Festive traditional sarong sets and comfortable cotton clothing for kids.',
    featuredImage:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    tagline: 'Junior Traditional Sarong Kits',
    children: [
      {
        id: 'a0000000-0000-0000-0000-000000000031',
        name: 'Traditional Sarongs & Kits',
        slug: 'kids-traditional-sarongs',
        description: 'Handloom sarong kits for festival functions.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000032',
        name: 'Party Wear',
        slug: 'kids-party-wear',
        description: 'Kids festive gowns and organza dresses.',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Artisan handcrafted belts, Dumbara shawls, and premium genuine leather goods.',
    featuredImage:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    tagline: 'Dumbara Handloom Shawls & Leather',
    children: [
      {
        id: 'a0000000-0000-0000-0000-000000000041',
        name: 'Belts & Wallets',
        slug: 'accessories-belts-wallets',
        description: 'Handcrafted genuine leather accessories.',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000042',
        name: 'Shawls & Bags',
        slug: 'accessories-shawls-bags',
        description: 'Dumbara handloom shawls and tote bags.',
      },
    ],
  },
];

export const categoryApi = {
  /**
   * Fetch category hierarchy tree with in-memory caching
   * @param {boolean} forceRefresh - Bypass cache if true
   * @returns {Promise<Array>} Array of root categories with nested children
   */
  async getCategories(forceRefresh = false) {
    if (!forceRefresh && inMemoryCategoryCache) {
      return inMemoryCategoryCache;
    }

    try {
      const response = await apiClient.get('/categories');
      // Axios interceptor unwraps { success, data, message } or returns response.data
      const categories = response?.data || response || [];
      if (Array.isArray(categories) && categories.length > 0) {
        inMemoryCategoryCache = categories;
        return categories;
      }
      return DEFAULT_FALLBACK_CATEGORIES;
    } catch {
      // In case of network error, return rich Sri Lankan category catalog fallback
      return DEFAULT_FALLBACK_CATEGORIES;
    }
  },

  /**
   * Clear in-memory category cache
   */
  clearCache() {
    inMemoryCategoryCache = null;
  },
};

export default categoryApi;
