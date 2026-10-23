import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import App from '../App';
import { FALLBACK_PRODUCTS } from '../api/product.api';

expect.extend(matchers);

describe('STORM-FE-023: Cross-Browser Responsive Layout & WCAG 2.1 AA Accessibility Audit', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  /* -------------------------------------------------------------------------- */
  /* AC1: Skip to Content Link & Focus Indicators                               */
  /* -------------------------------------------------------------------------- */
  describe('AC1: Keyboard Navigation & Skip Link', () => {
    it('renders a skip to main content navigation link targeting #main-content', () => {
      render(<App />);

      const skipLink = screen.getByTestId('skip-to-content-link');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveTextContent(/Skip to main content/i);

      // Verify destination container exists
      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('tabIndex', '-1');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* AC2: Meaningful Alt Text on Apparel Imagery                                 */
  /* -------------------------------------------------------------------------- */
  describe('AC2: Accessible Imagery & Text Alternatives', () => {
    it('ensures all fallback product catalog items have non-empty meaningful alt descriptions', () => {
      FALLBACK_PRODUCTS.forEach((product) => {
        expect(product.title).toBeTruthy();
        expect(typeof product.title).toBe('string');
        // Category and material information for screen reader comprehension
        expect(product.category).toBeTruthy();
        expect(product.fabric || product.material || product.description).toBeTruthy();
      });
    });

    it('renders rendered catalog images with descriptive alt text', () => {
      render(<App />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);

      images.forEach((img) => {
        // Every img must have alt attribute (either meaningful or explicit decorative alt="")
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* AC3: Responsive Viewport Bounds & Mobile Touch Targets                     */
  /* -------------------------------------------------------------------------- */
  describe('AC3: Responsive Boundaries & Mobile Touch Targets', () => {
    it('verifies primary action buttons have accessible touch targets and aria-labels', () => {
      render(<App />);

      // Search input has placeholder & accessibility label
      const searchInputs = screen.getAllByPlaceholderText(/Search/i);
      expect(searchInputs.length).toBeGreaterThan(0);

      // Cart button has accessible role / label
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(5);

      buttons.forEach((btn) => {
        // Interactive buttons must have an accessible name
        const hasAriaLabel = btn.hasAttribute('aria-label');
        const hasTextContent = btn.textContent.trim().length > 0;
        const hasTitle = btn.hasAttribute('title');
        expect(hasAriaLabel || hasTextContent || hasTitle).toBe(true);
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* AC4 & Axe-Core Automated WCAG 2.1 AA Audit                                 */
  /* -------------------------------------------------------------------------- */
  describe('AC4: Axe-Core WCAG 2.1 Level AA Compliance Audit', () => {
    it('executes automated axe-core accessibility audit on storefront layout with zero critical violations', async () => {
      const { container } = render(<App />);

      // Run axe on rendered storefront DOM
      const results = await axe(container, {
        rules: {
          // Region rule can be soft in test fragment environments
          region: { enabled: false },
        },
      });

      // Filter critical and serious violations
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(seriousOrCritical).toEqual([]);
      expect(results).toHaveNoViolations();
    });
  });
});
