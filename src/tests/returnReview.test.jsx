import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { isReturnEligible, returnApi } from '../api/return.api';
import { ReturnExchangeModal } from '../components/orders/ReturnExchangeModal';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import reviewApi from '../api/review.api';

// Mock APIs
vi.mock('../api/return.api', async () => {
  const actual = await vi.importActual('../api/return.api');
  return {
    ...actual,
    returnApi: {
      ...actual.returnApi,
      requestReturn: vi.fn(),
      getMyReturns: vi.fn(),
    },
  };
});

vi.mock('../api/review.api', () => ({
  default: {
    submitReview: vi.fn(),
    getProductReviews: vi.fn(),
  },
}));

describe('STORM-FE-016: 30-Day Return Modal & Verified Review with Photo Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1 & Failure Recovery: 30-Day Return Eligibility Calculator', () => {
    it('anchors 30-day cutoff strictly to delivered_at rather than order creation date', () => {
      // Order created 45 days ago, but delivered only 10 days ago -> must be ELIGIBLE
      const deliveredTenDaysAgo = new Date();
      deliveredTenDaysAgo.setDate(deliveredTenDaysAgo.getDate() - 10);

      const createdFortyFiveDaysAgo = new Date();
      createdFortyFiveDaysAgo.setDate(createdFortyFiveDaysAgo.getDate() - 45);

      const order = {
        id: 'ord-123',
        status: 'delivered',
        created_at: createdFortyFiveDaysAgo.toISOString(),
        delivered_at: deliveredTenDaysAgo.toISOString(),
      };

      const result = isReturnEligible(order, { id: 'it-1', title: 'Batik Shirt' });
      expect(result.eligible).toBe(true);
      expect(result.daysRemaining).toBe(20);
    });

    it('rejects returns when delivered_at exceeds 30 calendar days', () => {
      const deliveredThirtyFiveDaysAgo = new Date();
      deliveredThirtyFiveDaysAgo.setDate(deliveredThirtyFiveDaysAgo.getDate() - 35);

      const order = {
        id: 'ord-old',
        status: 'delivered',
        delivered_at: deliveredThirtyFiveDaysAgo.toISOString(),
      };

      const result = isReturnEligible(order, { id: 'it-1' });
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/Return window expired/i);
    });

    it('blocks returns on final sale items (AC1)', () => {
      const recentDelivery = new Date();
      recentDelivery.setDate(recentDelivery.getDate() - 5);

      const order = {
        id: 'ord-sale',
        status: 'delivered',
        delivered_at: recentDelivery.toISOString(),
      };

      const finalSaleItem = { id: 'it-clearance', is_final_sale: true };
      const result = isReturnEligible(order, finalSaleItem);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Final Sale - Not Returnable');
    });

    it('blocks return initiation for non-delivered orders', () => {
      const order = { id: 'ord-transit', status: 'shipped' };
      const result = isReturnEligible(order, { id: 'it-1' });
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/marked as Delivered/i);
    });
  });

  describe('AC2: ReturnExchangeModal Form Interactions', () => {
    const deliveredOrder = {
      id: 'ord-del-1',
      order_number: 'DFC-20261001-1122',
      status: 'delivered',
      delivered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'it-saree',
          title: 'Ceylon Handloom Saree',
          size: 'FREE',
          color: 'Ocean Blue',
          total_price: 9250,
        },
      ],
    };

    it('toggles between Return for Refund and Size Exchange', () => {
      render(<ReturnExchangeModal isOpen={true} order={deliveredOrder} onClose={vi.fn()} />);

      expect(screen.getByTestId('eligible-return-banner')).toBeInTheDocument();
      expect(screen.queryByTestId('exchange-variant-group')).not.toBeInTheDocument();

      // Click Exchange
      fireEvent.click(screen.getByTestId('btn-type-exchange'));
      expect(screen.getByTestId('exchange-variant-group')).toBeInTheDocument();
      expect(screen.getByTestId('select-exchange-size')).toBeInTheDocument();

      // Click Return
      fireEvent.click(screen.getByTestId('btn-type-return'));
      expect(screen.queryByTestId('exchange-variant-group')).not.toBeInTheDocument();
    });

    it('submits exchange request payload with selected size', async () => {
      returnApi.requestReturn.mockResolvedValueOnce({ id: 'ret-123', status: 'pending' });
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      render(
        <ReturnExchangeModal
          isOpen={true}
          order={deliveredOrder}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      );

      fireEvent.click(screen.getByTestId('btn-type-exchange'));
      fireEvent.change(screen.getByTestId('select-exchange-size'), {
        target: { value: 'XL' },
      });
      fireEvent.change(screen.getByTestId('select-return-reason'), {
        target: { value: 'Size Too Small / Tight' },
      });

      fireEvent.click(screen.getByTestId('submit-return-request-btn'));

      await waitFor(() => {
        expect(returnApi.requestReturn).toHaveBeenCalledWith(
          expect.objectContaining({
            order_id: deliveredOrder.order_number,
            type: 'exchange',
            replacement_size: 'XL',
            reason: 'Size Too Small / Tight',
          })
        );
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('AC3 & AC4: WriteReviewModal & Client-Side File Validation', () => {
    const sampleProduct = {
      id: 'prod-shirt-01',
      title: 'Batik Linen Resort Shirt',
    };

    it('blocks non-delivered orders with verified purchase gate explanation (AC4)', () => {
      const inTransitOrder = { id: 'ord-transit-2', status: 'shipped' };

      render(
        <WriteReviewModal
          isOpen={true}
          product={sampleProduct}
          order={inTransitOrder}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('review-gate-card')).toBeInTheDocument();
      expect(screen.getByText(/Verified Delivered Purchases Only/i)).toBeInTheDocument();
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    it('updates star rating and validates image upload MIME type and 5MB size limit (AC3)', async () => {
      render(
        <WriteReviewModal
          isOpen={true}
          product={sampleProduct}
          order={{ id: 'ord-delivered', status: 'delivered' }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('review-form')).toBeInTheDocument();

      // Click 4 stars
      const star4 = screen.getByTestId('star-btn-4');
      fireEvent.click(star4);
      expect(screen.getByTestId('rating-score-text')).toHaveTextContent('4 Stars');

      // Test Invalid MIME type (text file)
      const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('input-review-file');
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(screen.getByTestId('file-error-alert')).toHaveTextContent(
        /Only JPEG, PNG, and WebP are accepted/i
      );

      // Test File exceeding 5MB limit
      const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.jpg', {
        type: 'image/jpeg',
      });
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      expect(screen.getByTestId('file-error-alert')).toHaveTextContent(
        /Maximum permitted size is 5MB/i
      );
    });

    it('submits valid review with comments and rating to reviewApi', async () => {
      reviewApi.submitReview.mockResolvedValueOnce({ id: 'rev-new-1' });
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      render(
        <WriteReviewModal
          isOpen={true}
          product={sampleProduct}
          order={{ id: 'ord-delivered', status: 'delivered' }}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      );

      const titleInput = screen.getByTestId('input-review-title');
      const commentInput = screen.getByTestId('textarea-review-comment');
      const submitBtn = screen.getByTestId('submit-review-btn');

      fireEvent.change(titleInput, { target: { value: 'Incredible handloom craft' } });
      fireEvent.change(commentInput, {
        target: {
          value: 'The breathable linen fabric is truly second to none. Fits like a glove!',
        },
      });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(reviewApi.submitReview).toHaveBeenCalledWith(
          sampleProduct.id,
          expect.objectContaining({
            rating: 5,
            title: 'Incredible handloom craft',
            comment: 'The breathable linen fabric is truly second to none. Fits like a glove!',
          })
        );
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });
});
