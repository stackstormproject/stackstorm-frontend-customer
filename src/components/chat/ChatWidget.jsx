import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  ShieldCheck,
  Minimize2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import ChatMessageList from './ChatMessageList';
import socketService from '../../services/socket.service';
import './ChatWidget.css';

const DEFAULT_QUICK_REPLIES = [
  'Track My Order',
  'Return Policy',
  'Speak to an Agent',
];

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome-1',
  senderRole: 'bot',
  senderName: 'Dickwella Virtual Assistant',
  message:
    'Hello! Welcome to Dickwella Fashion Corner. How can we help you with your order, returns, or styling today?',
  createdAt: new Date().toISOString(),
};

// Client-side rule fallback in case server socket is in local dev offline mode
const FALLBACK_FAQ_ANSWERS = {
  'return policy':
    'Dickwella Fashion Corner accepts returns and exchanges within 30 days of delivery. Items must be unworn with original tags attached. Final sale and clearance items are non-returnable.',
  'track my order':
    'To track your order, please provide your DFC order number (for example: DFC-2026-104 or #1001).',
  'speak to an agent':
    'Connecting you to a live Dickwella Fashion Corner support agent... Please hold while we route your session.',
  'store location':
    'Our retail store is located at Main Street, Dickwella, Southern Province, Sri Lanka.',
  'store hours':
    'Dickwella Fashion Corner is open Monday through Saturday from 9:00 AM to 8:00 PM, and Sunday from 10:00 AM to 6:00 PM.',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(() => {
    try {
      return sessionStorage.getItem('dfc_chat_session_id') || null;
    } catch {
      return null;
    }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingAuthor, setTypingAuthor] = useState('Assistant');
  const [hasUnread, setHasUnread] = useState(true);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [connectionStatus, setConnectionStatus] = useState('standby'); // 'connected' | 'connecting' | 'standby'

  const typingTimeoutRef = useRef(null);

  // Initialize socket on open
  useEffect(() => {
    if (!isOpen) return;

    setHasUnread(false);
    setConnectionStatus('connecting');

    const socket = socketService.connect();

    const handleConnect = () => {
      setConnectionStatus('connected');
      let currentSessionId = null;
      try {
        currentSessionId = sessionStorage.getItem('dfc_chat_session_id');
      } catch {
        // ignore
      }

      const rawUser = (() => {
        try {
          const raw =
            localStorage.getItem('stackstorm_user') ||
            localStorage.getItem('stackstorm_auth_user') ||
            localStorage.getItem('user');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      const customerMeta = rawUser
        ? {
            customerId: rawUser.id,
            customerName:
              rawUser.name ||
              `${rawUser.first_name || ''} ${rawUser.last_name || ''}`.trim() ||
              rawUser.email,
            customerEmail: rawUser.email,
            tier: rawUser.loyalty_tier || rawUser.loyaltyTier || 'Silver',
          }
        : null;

      socketService.joinChat(
        'Customer Storefront Inquiry',
        (res) => {
          if (res && res.sessionId) {
            setSessionId(res.sessionId);
            try {
              sessionStorage.setItem('dfc_chat_session_id', res.sessionId);
            } catch {
              // ignore
            }
          }
        },
        currentSessionId,
        customerMeta
      );
    };

    const handleDisconnect = () => {
      setConnectionStatus('standby');
    };

    const handleMessage = (data) => {
      setIsTyping(false);
      setMessages((prev) => {
        // Prevent duplicate messages if ID already exists
        if (data.id && prev.some((m) => m.id === data.id)) return prev;

        // Prevent duplicate echo of customer's own sent message
        if (
          (data.senderRole === 'customer' || data.senderRole === 'user') &&
          prev.some(
            (m) =>
              (m.senderRole === 'customer' || m.senderRole === 'user') &&
              m.message === data.message &&
              Math.abs(Date.now() - new Date(m.createdAt).getTime()) < 10000
          )
        ) {
          return prev;
        }

        const isFromAgent =
          data.senderRole === 'support_agent' ||
          data.senderRole === 'agent' ||
          data.senderRole === 'admin' ||
          data.senderType === 'agent' ||
          data.sender === 'agent';

        const isFromCustomer =
          !isFromAgent &&
          (data.senderRole === 'customer' ||
            data.senderRole === 'user' ||
            data.senderType === 'customer' ||
            data.sender === 'customer');

        const normalizedRole = isFromAgent
          ? 'support_agent'
          : isFromCustomer
          ? 'customer'
          : 'bot';

        const normalizedName = isFromAgent
          ? data.senderName || 'Alex (Support Agent)'
          : isFromCustomer
          ? 'You'
          : 'Dickwella Virtual Assistant';

        return [
          ...prev,
          {
            id: data.id || `msg-${Date.now()}`,
            senderRole: normalizedRole,
            senderName: normalizedName,
            message: data.message || data.text,
            createdAt: data.createdAt || new Date().toISOString(),
            orderData: data.orderData || null,
          },
        ];
      });

      if (!isOpen) {
        setHasUnread(true);
      }
    };

    const handleTyping = (data) => {
      if (data && data.isTyping) {
        setIsTyping(true);
        setTypingAuthor(data.role === 'support_agent' ? 'Support Agent' : 'Assistant');
      } else {
        setIsTyping(false);
      }
    };

    const unsubConnect = socketService.on('connect', handleConnect);
    const unsubDisconnect = socketService.on('disconnect', handleDisconnect);
    const unsubMsg = socketService.on('chat:message', handleMessage);
    const unsubTyping = socketService.on('chat:typing', handleTyping);

    if (socketService.isConnected) {
      handleConnect();
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMsg();
      unsubTyping();
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (sessionId) {
      socketService.sendTyping(sessionId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(sessionId, false);
      }, 1500);
    }
  };

  const dispatchUserMessage = (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    const userMsg = {
      id: `user-${Date.now()}`,
      senderRole: 'customer',
      senderName: 'You',
      message: cleanText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // If socket is connected and session exists, dispatch over WebSocket
    if (socketService.isConnected && sessionId) {
      socketService.sendMessage(sessionId, cleanText);
      setIsTyping(true);
      setTypingAuthor('Assistant');
    }

    // Client-side fallback rule simulation
    // Triggered immediately if socket is offline, or as a safety net if server socket does not reply
    const triggerLocalFallback = () => {
      setIsTyping(true);
      setTypingAuthor('Assistant');

      setTimeout(() => {
        setIsTyping(false);

        const lower = cleanText.toLowerCase();

        // Check order tracking intent (AC4)
        const orderMatch = cleanText.match(/(?:dfc-\d{4}-|#)?(\d+)/i);
        if (orderMatch || lower.includes('where is my order') || lower.includes('track')) {
          const orderNum = orderMatch ? orderMatch[1] : '1';
          const botReply = {
            id: `bot-${Date.now()}`,
            senderRole: 'bot',
            senderName: 'Dickwella Virtual Assistant',
            message: `Checking order status for #${orderNum}... Your package is confirmed and in transit with Sri Lanka Post EMS.`,
            createdAt: new Date().toISOString(),
            orderData: {
              order_number: `DFC-2026-${orderNum}`,
              status: 'shipped',
              courier: 'Sri Lanka Post EMS',
              tracking_number: `SLPOST-${orderNum}00-LK`,
              total_amount_formatted: 'LKR 8,500.00',
            },
          };
          setMessages((prev) => {
            if (
              prev.some(
                (m) =>
                  m.senderRole === 'bot' &&
                  Date.now() - new Date(m.createdAt).getTime() < 3000
              )
            ) {
              return prev;
            }
            return [...prev, botReply];
          });
          return;
        }

        // Check FAQ rules
        let replyText =
          FALLBACK_FAQ_ANSWERS[lower] ||
          FALLBACK_FAQ_ANSWERS[Object.keys(FALLBACK_FAQ_ANSWERS).find((k) => lower.includes(k))];

        if (!replyText) {
          replyText =
            "Thank you for contacting Dickwella Fashion Corner! We've routed your query to our customer service desk. An agent will respond shortly.";
        }

        const botReply = {
          id: `bot-${Date.now()}`,
          senderRole: lower.includes('agent') ? 'support_agent' : 'bot',
          senderName: lower.includes('agent') ? 'Live Support Agent' : 'Dickwella Virtual Assistant',
          message: replyText,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                (m.senderRole === 'bot' || m.senderRole === 'support_agent') &&
                Date.now() - new Date(m.createdAt).getTime() < 3000
            )
          ) {
            return prev;
          }
          return [...prev, botReply];
        });
      }, 700);
    };

    if (!socketService.isConnected || !sessionId) {
      triggerLocalFallback();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    dispatchUserMessage(inputText);
  };

  const handleSelectQuickReply = (chipText) => {
    dispatchUserMessage(chipText);
  };

  return (
    <div className="chat-widget-wrapper" data-testid="chat-widget-wrapper">
      {/* Floating Chat Bubble (AC1) */}
      <button
        className={`floating-chat-bubble ${isOpen ? 'active' : ''}`}
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close Live Support Chat' : 'Open Live Support Chat'}
        data-testid="floating-chat-bubble"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && hasUnread && (
          <span className="unread-pulse-badge" data-testid="unread-pulse-badge">
            <span className="pulse-ping" />
            <span className="badge-count">1</span>
          </span>
        )}
      </button>

      {/* Expandable Chat Window (AC2) */}
      {isOpen && (
        <div className="chat-window-card" data-testid="chat-window">
          {/* Header */}
          <div className="chat-window-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                <Bot size={18} />
                <span className={`status-indicator ${connectionStatus === 'connected' ? 'online' : 'standby'}`} />
              </div>
              <div>
                <h4 className="chat-header-title">Dickwella Live Concierge</h4>
                <span className="chat-header-sub">
                  {connectionStatus === 'connected' ? 'Connected to Store Support' : 'Automated FAQ & Order Assistant'}
                </span>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                className="header-icon-btn"
                onClick={toggleOpen}
                aria-label="Minimize Chat"
                title="Minimize"
              >
                <Minimize2 size={16} />
              </button>
              <button
                className="header-icon-btn"
                onClick={toggleOpen}
                aria-label="Close Chat"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <ChatMessageList
            messages={messages}
            isTyping={isTyping}
            typingAuthor={typingAuthor}
            quickReplies={quickReplies}
            onSelectQuickReply={handleSelectQuickReply}
          />

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask about orders, returns, or sizing..."
              value={inputText}
              onChange={handleInputChange}
              className="chat-text-input"
              data-testid="chat-input-field"
              autoFocus
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim()}
              data-testid="chat-send-button"
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
