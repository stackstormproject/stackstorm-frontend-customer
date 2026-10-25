import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrandStoryPage } from '../pages/BrandStoryPage';
import App from '../App';

describe('BrandStoryPage Component & App Integration', () => {
  it('renders artisan heritage headers, chapters, and key statistics', () => {
    const handleBack = vi.fn();
    render(<BrandStoryPage onBackToCatalog={handleBack} />);

    expect(screen.getByTestId('brand-story-page')).toBeInTheDocument();
    expect(screen.getByText(/Woven in the Coastal Breeze of/i)).toBeInTheDocument();
    expect(screen.getByText('Dickwella')).toBeInTheDocument();
    expect(screen.getByText(/The Living Atelier of Southern Sri Lanka/i)).toBeInTheDocument();

    // Verify Chapters
    expect(screen.getByText(/The Wooden Loom & The Rhythms of the South/i)).toBeInTheDocument();
    expect(screen.getByText(/The Alchemy of Wax-Resist Batik/i)).toBeInTheDocument();
    expect(screen.getByText(/Empowering Local Weaving Families/i)).toBeInTheDocument();

    // Verify 4-Stage Process
    expect(screen.getByText(/The 4-Stage Artisan Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/Organic Fiber Selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Heritage Hand Looming/i)).toBeInTheDocument();
    expect(screen.getByText(/Wax Batik & Cold Dyeing/i)).toBeInTheDocument();
    expect(screen.getByText(/Sun Curing & Tailoring/i)).toBeInTheDocument();

    // Verify Statistics
    expect(screen.getByText('1988')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('triggers onBackToCatalog when back button and CTA button are clicked', () => {
    const handleBack = vi.fn();
    render(<BrandStoryPage onBackToCatalog={handleBack} />);

    const backBtn = screen.getByTestId('brand-story-back-btn');
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    const ctaBtn = screen.getByTestId('brand-story-cta-btn');
    fireEvent.click(ctaBtn);
    expect(handleBack).toHaveBeenCalledTimes(2);
  });

  it('navigates to BrandStoryPage from Home hero button in App', async () => {
    // Mock global fetch for health check
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/health') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { status: 'operational' } }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    await act(async () => {
      render(<App />);
    });

    // Bottom announcement bar should be present
    expect(screen.getByTestId('bottom-announcement-bar')).toBeInTheDocument();
    expect(screen.getByText(/Main Street, Dickwella, Matara/i)).toBeInTheDocument();
    expect(screen.getByText(/Islandwide Courier Delivery Across Sri Lanka/i)).toBeInTheDocument();
    expect(screen.getByText(/Dispatch: Next Business Day/i)).toBeInTheDocument();

    // Click "Our Heritage Story" in Hero
    const heroStoryBtn = screen.getByTestId('hero-brand-story-btn');
    await act(async () => {
      fireEvent.click(heroStoryBtn);
    });

    // Brand story page should now be visible
    expect(screen.getByTestId('brand-story-page')).toBeInTheDocument();

    // Click back to collections
    const backBtn = screen.getByTestId('brand-story-back-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Should return to catalog view
    expect(screen.queryByTestId('brand-story-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-brand-story-btn')).toBeInTheDocument();
  });
});
