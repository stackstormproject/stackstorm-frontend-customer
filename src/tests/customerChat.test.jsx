import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWidget from '../components/chat/ChatWidget';
import ChatMessageList from '../components/chat/ChatMessageList';
import socketService from '../services/socket.service';

// Mock socket.service
vi.mock('../services/socket.service', () => {
  const handlers = new Map();
  return {
    default: {
      connect: vi.fn().mockReturnValue({}),
      disconnect: vi.fn(),
      joinChat: vi.fn((subject, cb) => {
        if (typeof cb === 'function') cb({ success: true, sessionId: 'session-test-123' });
      }),
      sendMessage: vi.fn(),
      sendTyping: vi.fn(),
      leaveChat: vi.fn(),
      isConnected: true,
      on: vi.fn((event, handler) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event).add(handler);
        return () => handlers.get(event)?.delete(handler);
      }),
      off: vi.fn((event, handler) => {
        handlers.get(event)?.delete(handler);
      }),
      _trigger: (event, data) => {
        handlers.get(event)?.forEach((fn) => fn(data));
      },
    },
  };
});

describe('STORM-FE-021: Customer Floating Live Chat Widget with Automated FAQ / Order Tracking Bot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* AC1 & AC2: Floating Bubble & Expandable Chat Window                        */
  /* -------------------------------------------------------------------------- */
  it('renders the floating chat bubble with pulse notification badge and toggles open/close', () => {
    render(<ChatWidget />);

    const bubble = screen.getByTestId('floating-chat-bubble');
    expect(bubble).toBeInTheDocument();
    expect(screen.getByTestId('unread-pulse-badge')).toBeInTheDocument();

    // Window should initially be closed
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();

    // Click bubble to open
    fireEvent.click(bubble);
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByText('Dickwella Live Concierge')).toBeInTheDocument();

    // Click bubble again to close/minimize
    fireEvent.click(bubble);
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* AC3: Quick-Action Chips Rendering & Dispatch                               */
  /* -------------------------------------------------------------------------- */
  it('renders chatbot quick-action chips and dispatches selected quick query', async () => {
    render(<ChatWidget />);

    // Open chat
    fireEvent.click(screen.getByTestId('floating-chat-bubble'));

    // Check quick-action chips
    const chipsContainer = screen.getByTestId('quick-action-chips');
    expect(chipsContainer).toBeInTheDocument();
    expect(screen.getByText('Track My Order')).toBeInTheDocument();
    expect(screen.getByText('Return Policy')).toBeInTheDocument();
    expect(screen.getByText('Speak to an Agent')).toBeInTheDocument();

    // Click "Return Policy" quick chip
    const returnPolicyChip = screen.getByText('Return Policy');
    fireEvent.click(returnPolicyChip);

    // Verify user message appears in list (both in chip and in message bubble)
    await waitFor(() => {
      expect(screen.getAllByText('Return Policy').length).toBeGreaterThanOrEqual(2);
    });

    // Verify socketService.sendMessage was called or fallback generated
    expect(socketService.sendMessage).toHaveBeenCalledWith('session-test-123', 'Return Policy');
  });

  /* -------------------------------------------------------------------------- */
  /* AC4: Order Tracking Parsing & Real-Time Tracking Summary Embed             */
  /* -------------------------------------------------------------------------- */
  it('parses order tracking query and renders structured order status card in message list', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        senderRole: 'bot',
        message: 'Checking order status for DFC-2026-104...',
        createdAt: new Date().toISOString(),
        orderData: {
          order_number: 'DFC-2026-104',
          status: 'shipped',
          courier: 'Sri Lanka Post EMS',
          tracking_number: 'SLPOST-81100-99',
          total_amount_formatted: 'LKR 8,500.00',
        },
      },
    ];

    render(<ChatMessageList messages={mockMessages} />);

    expect(screen.getByTestId('chat-order-card')).toBeInTheDocument();
    expect(screen.getByText('DFC-2026-104')).toBeInTheDocument();
    expect(screen.getByText('SHIPPED')).toBeInTheDocument();
    expect(screen.getByText('Sri Lanka Post EMS')).toBeInTheDocument();
    expect(screen.getByText('SLPOST-81100-99')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* Typing Indicator & Manual Text Submission                                  */
  /* -------------------------------------------------------------------------- */
  it('renders typing indicator when support agent or bot is typing', () => {
    render(<ChatMessageList messages={[]} isTyping={true} typingAuthor="Support Agent" />);

    expect(screen.getByTestId('chat-typing-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Support Agent is typing.../i)).toBeInTheDocument();
  });

  it('allows customer to submit custom inquiry via text input and send button', async () => {
    render(<ChatWidget />);

    fireEvent.click(screen.getByTestId('floating-chat-bubble'));

    const input = screen.getByTestId('chat-input-field');
    const sendBtn = screen.getByTestId('chat-send-button');

    // Button should be disabled when empty
    expect(sendBtn).toBeDisabled();

    // Type query
    fireEvent.change(input, { target: { value: 'Where is your store located?' } });
    expect(sendBtn).not.toBeDisabled();

    // Submit
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Where is your store located?')).toBeInTheDocument();
    });

    expect(socketService.sendMessage).toHaveBeenCalledWith(
      'session-test-123',
      'Where is your store located?'
    );
  });
});
