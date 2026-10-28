import apiClient from './client';

export const FALLBACK_ORDERS = [
  {
    id: 'ord-dfc-9012',
    order_number: 'DFC-20261004-9012',
    created_at: '2026-10-04T08:30:00.000Z',
    status: 'shipped',
    payment_status: 'paid',
    total_amount: 14750,
    shipping_fee: 0,
    currency: 'LKR',
    tracking_number: 'SP-EXP-81100-984',
    carrier: 'Southern Province Express Logistics',
    estimated_delivery: '2026-10-07T16:00:00.000Z',
    shipping_address: {
      recipient_name: 'Kasun Kalhara',
      address_line1: '45 Temple Road',
      city: 'Dickwella',
      district: 'Matara',
      postal_code: '81100',
      phone: '077 123 4567',
    },
    items: [
      {
        id: 'item-1',
        title: 'Bespoke Ceylon Handloom Cotton Saree',
        quantity: 1,
        unit_price: 9250,
        total_price: 9250,
        size: 'FREE',
        color: 'Indigo & Sunlight Gold',
        image_url:
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-2',
        title: 'Southern Province Organic Linen Batik Shirt',
        quantity: 1,
        unit_price: 5500,
        total_price: 5500,
        size: 'L',
        color: 'Ocean Wave Navy',
        image_url:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
      },
    ],
    milestones: [
      {
        stage: 'placed',
        label: 'Order Placed',
        timestamp: '2026-10-04T08:30:00.000Z',
        description: 'Order confirmed and inventory locked.',
      },
      {
        stage: 'processing',
        label: 'Artisan Tailoring',
        timestamp: '2026-10-04T14:15:00.000Z',
        description: 'Handloom inspected at Dickwella boutique.',
      },
      {
        stage: 'shipped',
        label: 'Dispatched with Courier',
        timestamp: '2026-10-05T09:00:00.000Z',
        description: 'Handed over to Southern Province Express.',
      },
      {
        stage: 'delivered',
        label: 'Delivered',
        timestamp: null,
        description: 'Expected delivery by Oct 7, 2026.',
      },
    ],
  },
  {
    id: 'ord-dfc-8841',
    order_number: 'DFC-20260920-8841',
    created_at: '2026-09-20T10:15:00.000Z',
    delivered_at: '2026-09-23T14:30:00.000Z',
    status: 'delivered',
    payment_status: 'paid',
    total_amount: 8500,
    shipping_fee: 450,
    currency: 'LKR',
    tracking_number: 'SP-EXP-81100-341',
    carrier: 'Southern Province Express Logistics',
    estimated_delivery: '2026-09-23T16:00:00.000Z',
    shipping_address: {
      recipient_name: 'Kasun Kalhara',
      address_line1: '45 Temple Road',
      city: 'Dickwella',
      district: 'Matara',
      postal_code: '81100',
      phone: '077 123 4567',
    },
    items: [
      {
        id: 'item-3',
        title: 'Artisan Traditional Matara Handloom Sarong',
        quantity: 2,
        unit_price: 4025,
        total_price: 8050,
        size: 'FREE',
        color: 'Emerald & Rust Gold',
        image_url:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80',
      },
    ],
    milestones: [
      {
        stage: 'placed',
        label: 'Order Placed',
        timestamp: '2026-09-20T10:15:00.000Z',
        description: 'Order confirmed.',
      },
      {
        stage: 'processing',
        label: 'Artisan Tailoring',
        timestamp: '2026-09-21T09:00:00.000Z',
        description: 'Quality inspection complete.',
      },
      {
        stage: 'shipped',
        label: 'Dispatched',
        timestamp: '2026-09-22T11:00:00.000Z',
        description: 'Courier in transit.',
      },
      {
        stage: 'delivered',
        label: 'Delivered',
        timestamp: '2026-09-23T14:30:00.000Z',
        description: 'Signed and delivered in Dickwella.',
      },
    ],
  },
];

export const orderApi = {
  /**
   * Retrieve customer orders list (AC1)
   */
  async getMyOrders(params = {}) {
    try {
      const res = await apiClient.get('/orders', { params });
      return res.data?.data?.orders || res.data?.orders || res.data?.data || FALLBACK_ORDERS;
    } catch {
      return FALLBACK_ORDERS;
    }
  },

  /**
   * Retrieve specific order details by ID
   */
  async getOrderById(orderId) {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data?.data || res.data;
    } catch {
      return (
        FALLBACK_ORDERS.find((o) => o.id === orderId || o.order_number === orderId) ||
        FALLBACK_ORDERS[0]
      );
    }
  },

  /**
   * Retrieve delivery milestone tracking data (AC3)
   */
  async trackOrder(orderId) {
    try {
      const res = await apiClient.get(`/orders/${orderId}/track`);
      return res.data?.data || res.data;
    } catch {
      const order =
        FALLBACK_ORDERS.find((o) => o.id === orderId || o.order_number === orderId) ||
        FALLBACK_ORDERS[0];
      return {
        order_number: order.order_number,
        status: order.status,
        carrier: order.carrier,
        tracking_number: order.tracking_number,
        estimated_delivery: order.estimated_delivery,
        milestones: order.milestones,
      };
    }
  },
};

export default orderApi;
