import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';
import { ToastContainer } from '../components/common/ToastContainer';
import { Modal } from '../components/common/Modal';

// Test consumer component for Toast testing
const TestToastConsumer = () => {
  const { toast } = useToast();

  return (
    <div>
      <button
        onClick={() => toast.success('Item added to cart successfully', { duration: 3000 })}
        data-testid="btn-success"
      >
        Trigger Success
      </button>
      <button
        onClick={() => toast.error('Failed to reserve stock', { duration: 2000 })}
        data-testid="btn-error"
      >
        Trigger Error
      </button>
      <button onClick={() => toast.warning('Low stock warning')} data-testid="btn-warning">
        Trigger Warning
      </button>
      <button onClick={() => toast.info('New collection available')} data-testid="btn-info">
        Trigger Info
      </button>
    </div>
  );
};

// Test consumer for Modal testing
const TestModalConsumer = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button onClick={() => setIsOpen(true)} data-testid="btn-open-modal">
        Open Modal
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Reservation Release"
        description="Are you sure you want to cancel your batik shirt reservation?"
        footer={
          <div>
            <button onClick={() => setIsOpen(false)} data-testid="modal-cancel-btn">
              Cancel
            </button>
            <button onClick={() => setIsOpen(false)} data-testid="modal-confirm-btn">
              Confirm Release
            </button>
          </div>
        }
      >
        <p>This will release the 15-minute hold on the selected SKU back to the public pool.</p>
      </Modal>
    </div>
  );
};

describe('STORM-FE-004: Global State, Toast Notifications & Modal Dialog System', () => {
  let portalRoot;

  beforeEach(() => {
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    if (portalRoot && portalRoot.parentNode) {
      portalRoot.parentNode.removeChild(portalRoot);
    }
    vi.useRealTimers();
  });

  describe('Toast System', () => {
    it('throws descriptive error when useToast is consumed outside ToastProvider', () => {
      const FallbackComponent = () => {
        useToast();
        return null;
      };

      // Suppress console.error during expected throw
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<FallbackComponent />)).toThrow(
        'useToast must be used within a ToastProvider'
      );
      consoleSpy.mockRestore();
    });

    it('renders a success toast with correct role and message upon user action', () => {
      render(
        <ToastProvider>
          <TestToastConsumer />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-success'));

      const toast = screen.getByTestId('toast-success');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Item added to cart successfully');
      expect(toast).toHaveAttribute('role', 'status');
    });

    it('renders error toast with role="alert"', () => {
      render(
        <ToastProvider>
          <TestToastConsumer />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-error'));

      const toast = screen.getByTestId('toast-error');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Failed to reserve stock');
      expect(toast).toHaveAttribute('role', 'alert');
    });

    it('dismisses toast immediately when the close button is clicked', () => {
      render(
        <ToastProvider>
          <TestToastConsumer />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-warning'));
      expect(screen.getByTestId('toast-warning')).toBeInTheDocument();

      const closeBtn = screen.getByLabelText('Dismiss notification');
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId('toast-warning')).not.toBeInTheDocument();
    });

    it('auto-dismisses toast after duration has elapsed', () => {
      vi.useFakeTimers();

      render(
        <ToastProvider>
          <TestToastConsumer />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-success'));
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();

      // Fast-forward 3000ms
      act(() => {
        vi.advanceTimersByTime(3100);
      });

      expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument();
    });

    it('pauses auto-dismiss countdown on mouseEnter and resumes on mouseLeave', () => {
      vi.useFakeTimers();

      render(
        <ToastProvider>
          <TestToastConsumer />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-success'));
      const toast = screen.getByTestId('toast-success');

      // Advance halfway (1500ms of 3000ms)
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();

      // Hover to pause
      fireEvent.mouseEnter(toast);

      // Advance by another 2000ms (would have expired if not paused)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();

      // Leave hover to resume
      fireEvent.mouseLeave(toast);

      // Advance remaining time (~1500ms + buffer)
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument();
    });
  });

  describe('Modal Dialog System', () => {
    it('does not render modal content in DOM when isOpen is false', () => {
      render(<TestModalConsumer defaultOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('mounts into React Portal with accessibility attributes and scroll lock when open', () => {
      render(<TestModalConsumer defaultOpen={true} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(screen.getByText('Confirm Reservation Release')).toBeInTheDocument();

      // Verifies portal mounting inside portalRoot
      expect(portalRoot.contains(dialog)).toBe(true);

      // Verifies scroll lock
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('dismisses modal on close button click and restores body overflow', () => {
      render(<TestModalConsumer defaultOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const closeButton = screen.getByTestId('modal-close-btn');

      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });

    it('dismisses modal on Escape key press', () => {
      render(<TestModalConsumer defaultOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('dismisses modal when backdrop is clicked', () => {
      render(<TestModalConsumer defaultOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const backdrop = screen.getByTestId('modal-backdrop');

      fireEvent.click(backdrop);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not dismiss modal when clicking inside dialog body', () => {
      render(<TestModalConsumer defaultOpen={true} />);

      const modalBody = screen.getByTestId('modal-body');
      fireEvent.click(modalBody);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
