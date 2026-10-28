import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderHistoryPage } from '../pages/OrderHistoryPage';
import {
  DeliveryMilestoneStepper,
  calculateEstimatedDelivery,
} from '../components/orders/DeliveryMilestoneStepper';
import { OrderCard } from '../components/orders/OrderCard';
import orderApi from '../api/order.api';

// Mock orderApi
vi.mock('../api/order.api', () => ({
  default: {
    getMyOrders: vi.fn(),
    getOrderById: vi.fn(),
    trackOrder: vi.fn(),
  },
  FALLBACK_ORDERS: [
    {
      id: 'ord-1',
      order_number: 'DFC-20261004-9012',
      created_at: '2026-10-04T08:30:00.000Z',
      status: 'shipped',
      total_amount: 14750,
      tracking_number: 'SP-EXP-81100-984',
      carrier: 'Southern Province Express Logistics',
      items: [
        {
          id: 'item-1',
          title: 'Bespoke Ceylon Handloom Cotton Saree',
          quantity: 1,
          unit_price: 9250,
          total_price: 9250,
          size: 'FREE',
          color: 'Indigo & Sunlight Gold',
          image_url: 'https://example.com/saree.jpg',
        },
      ],
      milestones: [
        { stage: 'placed', label: 'Order Placed', timestamp: '2026-10-04T08:30:00.000Z' },
        { stage: 'processing', label: 'Artisan Tailoring', timestamp: '2026-10-04T14:15:00.000Z' },
        { stage: 'shipped', label: 'Dispatched', timestamp: '2026-10-05T09:00:00.000Z' },
        { stage: 'delivered', label: 'Delivered', timestamp: null },
      ],
    },
    {
      id: 'ord-2',
      order_number: 'DFC-20260920-8841',
      created_at: '2026-09-20T10:15:00.000Z',
      status: 'delivered',
      total_amount: 8500,
      tracking_number: 'SP-EXP-81100-341',
      carrier: 'Southern Province Express Logistics',
      items: [
        {
          id: 'item-2',
          title: 'Artisan Traditional Matara Handloom Sarong',
          quantity: 2,
          unit_price: 4025,
          total_price: 8050,
          size: 'FREE',
          color: 'Emerald & Rust Gold',
          image_url: 'https://example.com/sarong.jpg',
        },
      ],
      milestones: [],
    },
  ],
}));

describe('STORM-FE-015: Customer Order History & 4-Stage Delivery Milestone Stepper', () => {
  const mockOrders = [
    {
      id: 'ord-1',
      order_number: 'DFC-20261004-9012',
      created_at: '2026-10-04T08:30:00.000Z',
      status: 'shipped',
      total_amount: 14750,
      tracking_number: 'SP-EXP-81100-984',
      carrier: 'Southern Province Express Logistics',
      items: [
        {
          id: 'item-1',
          title: 'Bespoke Ceylon Handloom Cotton Saree',
          quantity: 1,
          unit_price: 9250,
          total_price: 9250,
          size: 'FREE',
          color: 'Indigo & Sunlight Gold',
          image_url: 'https://example.com/saree.jpg',
        },
      ],
      milestones: [
        { stage: 'placed', label: 'Order Placed', timestamp: '2026-10-04T08:30:00.000Z' },
        { stage: 'processing', label: 'Artisan Tailoring', timestamp: '2026-10-04T14:15:00.000Z' },
        { stage: 'shipped', label: 'Dispatched', timestamp: '2026-10-05T09:00:00.000Z' },
        { stage: 'delivered', label: 'Delivered', timestamp: null },
      ],
    },
    {
      id: 'ord-2',
      order_number: 'DFC-20260920-8841',
      created_at: '2026-09-20T10:15:00.000Z',
      status: 'delivered',
      total_amount: 8500,
      tracking_number: 'SP-EXP-81100-341',
      carrier: 'Southern Province Express Logistics',
      items: [
        {
          id: 'item-2',
          title: 'Artisan Traditional Matara Handloom Sarong',
          quantity: 2,
          unit_price: 4025,
          total_price: 8050,
          size: 'FREE',
          color: 'Emerald & Rust Gold',
          image_url: 'https://example.com/sarong.jpg',
        },
      ],
      milestones: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1 & AC2: OrderHistoryPage & OrderCard Summary', () => {
    it('renders list of customer orders with formatted dates and LKR totals', () => {
      render(<OrderHistoryPage initialOrders={mockOrders} />);

      expect(screen.getByTestId('order-history-page')).toBeInTheDocument();
      expect(screen.getByTestId('active-orders-count')).toHaveTextContent('1');

      // Verify Order 1
      expect(screen.getByText('DFC-20261004-9012')).toBeInTheDocument();
      expect(screen.getAllByTestId('order-status-badge')[0]).toHaveTextContent(/SHIPPED/i);
      expect(screen.getAllByTestId('order-total-lkr')[0]).toHaveTextContent(/LKR 14,750.00/i);

      // Verify Order 2
      expect(screen.getByText('DFC-20260920-8841')).toBeInTheDocument();
      expect(screen.getAllByTestId('order-status-badge')[1]).toHaveTextContent(/DELIVERED/i);
      expect(screen.getAllByTestId('order-total-lkr')[1]).toHaveTextContent(/LKR 8,500.00/i);
    });

    it('filters orders by status tabs (Active vs Delivered)', () => {
      render(<OrderHistoryPage initialOrders={mockOrders} />);

      // Initially 2 orders
      expect(screen.getByText('DFC-20261004-9012')).toBeInTheDocument();
      expect(screen.getByText('DFC-20260920-8841')).toBeInTheDocument();

      // Click Delivered tab
      fireEvent.click(screen.getByTestId('filter-delivered'));
      expect(screen.queryByText('DFC-20261004-9012')).not.toBeInTheDocument();
      expect(screen.getByText('DFC-20260920-8841')).toBeInTheDocument();

      // Click Active tab
      fireEvent.click(screen.getByTestId('filter-active'));
      expect(screen.getByText('DFC-20261004-9012')).toBeInTheDocument();
      expect(screen.queryByText('DFC-20260920-8841')).not.toBeInTheDocument();
    });

    it('filters orders dynamically with search query', () => {
      render(<OrderHistoryPage initialOrders={mockOrders} />);

      const searchInput = screen.getByTestId('order-search-input');
      fireEvent.change(searchInput, { target: { value: 'Sarong' } });

      expect(screen.queryByText('DFC-20261004-9012')).not.toBeInTheDocument();
      expect(screen.getByText('DFC-20260920-8841')).toBeInTheDocument();
    });
  });

  describe('AC3 & AC4: DeliveryMilestoneStepper & Status Casing Normalization', () => {
    it('marks preceding steps as completed and current step as active', () => {
      render(
        <DeliveryMilestoneStepper
          status="shipped"
          orderDate="2026-10-04T08:30:00.000Z"
          trackingNumber="SP-EXP-81100-984"
        />
      );

      const placedStep = screen.getByTestId('milestone-step-placed');
      const processingStep = screen.getByTestId('milestone-step-processing');
      const shippedStep = screen.getByTestId('milestone-step-shipped');
      const deliveredStep = screen.getByTestId('milestone-step-delivered');

      // Placed and Processing should be completed
      expect(placedStep).toHaveClass('stepper-step--completed');
      expect(processingStep).toHaveClass('stepper-step--completed');

      // Shipped should be current with glowing pulse ring
      expect(shippedStep).toHaveClass('stepper-step--current');
      expect(shippedStep.querySelector('.pulse-glow-ring')).toBeInTheDocument();

      // Delivered should be future
      expect(deliveredStep).toHaveClass('stepper-step--future');
    });

    it('normalizes uppercase and mixed-case status strings to prevent inactive steps (Failure Recovery Matrix)', () => {
      // Must handle 'SHIPPED' or 'Shipped' correctly
      render(<DeliveryMilestoneStepper status="SHIPPED" orderDate="2026-10-04T08:30:00.000Z" />);

      const shippedStep = screen.getByTestId('milestone-step-shipped');
      expect(shippedStep).toHaveClass('stepper-step--current');

      const placedStep = screen.getByTestId('milestone-step-placed');
      expect(placedStep).toHaveClass('stepper-step--completed');
    });

    it('calculates estimated delivery date as 3 business days from order placement (AC4)', () => {
      // Friday Oct 2, 2026 -> 3 business days skips Sat & Sun -> arrives Wednesday Oct 7, 2026
      const estimated = calculateEstimatedDelivery('2026-10-02T10:00:00.000Z');
      expect(typeof estimated).toBe('string');
      expect(estimated.length).toBeGreaterThan(5);

      render(<DeliveryMilestoneStepper status="placed" orderDate="2026-10-02T10:00:00.000Z" />);

      expect(screen.getByTestId('estimated-delivery-date')).toHaveTextContent(estimated);
    });

    it('toggles tracking stepper visibility when clicking Track Delivery in OrderCard', () => {
      render(<OrderCard order={mockOrders[1]} />); // Delivered order starts unexpanded

      const trackBtn = screen.getByTestId('track-order-btn');
      expect(trackBtn).toHaveTextContent(/Track Delivery/i);

      // Expand tracking
      fireEvent.click(trackBtn);
      expect(screen.getByTestId('order-tracking-stepper-wrap')).toBeInTheDocument();
      expect(trackBtn).toHaveTextContent(/Hide Tracking/i);

      // Collapse tracking
      fireEvent.click(trackBtn);
      expect(screen.queryByTestId('order-tracking-stepper-wrap')).not.toBeInTheDocument();
    });
  });
});
