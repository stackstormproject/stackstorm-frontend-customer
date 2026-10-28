import React, { useEffect, useRef } from 'react';
import { Bot, User, ShieldCheck, Package, Clock, ExternalLink } from 'lucide-react';
import './ChatMessageList.css';

export default function ChatMessageList({
  messages = [],
  isTyping = false,
  typingAuthor = 'Assistant',
  quickReplies = [],
  onSelectQuickReply,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="chat-messages-container" data-testid="chat-message-list">
      {messages.map((msg, index) => {
        const isUser = msg.senderRole === 'customer' || msg.senderRole === 'user';
        const isBot = msg.senderRole === 'bot';
        const isAgent =
          msg.senderRole === 'support_agent' ||
          msg.senderRole === 'agent' ||
          msg.senderRole === 'admin';

        return (
          <div
            key={msg.id || `msg-${index}`}
            className={`chat-message-row ${isUser ? 'user-row' : 'bot-row'}`}
            data-testid={`chat-message-${msg.id || index}`}
          >
            {/* Avatar for Bot / Agent */}
            {!isUser && (
              <div className={`message-avatar ${isAgent ? 'agent-avatar' : 'bot-avatar'}`}>
                {isAgent ? <ShieldCheck size={16} /> : <Bot size={16} />}
              </div>
            )}

            {/* Bubble */}
            <div className="message-content-group">
              <div className="message-sender-name">
                {isUser
                  ? 'You'
                  : isAgent
                    ? msg.senderName || 'Live Support Agent'
                    : 'Dickwella Virtual Assistant'}
              </div>

              <div
                className={`message-bubble ${isUser ? 'user-bubble' : isAgent ? 'agent-bubble' : 'bot-bubble'}`}
              >
                <p className="message-text">{msg.message}</p>

                {/* If message includes structured order tracking embed */}
                {msg.orderData && (
                  <div className="order-tracking-card" data-testid="chat-order-card">
                    <div className="order-card-header">
                      <Package size={16} className="order-card-icon" />
                      <span className="order-card-number font-bold font-mono">
                        {msg.orderData.order_number || msg.orderData.orderNumber}
                      </span>
                      <span
                        className={`order-status-pill status-${(msg.orderData.status || 'processing').toLowerCase()}`}
                      >
                        {(msg.orderData.status || 'PROCESSING').toUpperCase()}
                      </span>
                    </div>

                    <div className="order-card-details">
                      {msg.orderData.courier && (
                        <div className="order-detail-item">
                          <span className="detail-label">Courier:</span>
                          <span className="detail-value">{msg.orderData.courier}</span>
                        </div>
                      )}
                      {msg.orderData.tracking_number && (
                        <div className="order-detail-item">
                          <span className="detail-label">Waybill:</span>
                          <span className="detail-value font-mono">
                            {msg.orderData.tracking_number}
                          </span>
                        </div>
                      )}
                      {msg.orderData.total_amount_formatted && (
                        <div className="order-detail-item">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value font-mono font-bold">
                            {msg.orderData.total_amount_formatted}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="message-timestamp">{formatTime(msg.createdAt)}</span>
            </div>

            {/* Avatar for User */}
            {isUser && (
              <div className="message-avatar user-avatar">
                <User size={16} />
              </div>
            )}
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="chat-message-row bot-row" data-testid="chat-typing-indicator">
          <div className="message-avatar bot-avatar">
            <Bot size={16} />
          </div>
          <div className="message-content-group">
            <div className="message-bubble bot-bubble typing-bubble">
              <span className="typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
              <span className="typing-label">{typingAuthor} is typing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Chips (AC3) */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="quick-action-chips-container" data-testid="quick-action-chips">
          <span className="quick-chips-heading">Suggested Actions:</span>
          <div className="quick-chips-list">
            {quickReplies.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip-btn"
                onClick={() => onSelectQuickReply && onSelectQuickReply(chip)}
                data-testid={`quick-chip-${idx}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
