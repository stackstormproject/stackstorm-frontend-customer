/**
 * WebSocket & Real-Time Chat Connection Manager
 * StackStorm E-Commerce Platform — Dickwella Fashion Corner
 * Module Owner: Amarawickrama R.H. (FR-024 / FR-025 / SDS §12.1)
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Initializes or reuses the Socket.IO connection.
   * Attaches JWT authentication token from localStorage if present.
   */
  connect(token = null) {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('stackstorm_token');

    if (this.socket) {
      if (this.socket.connected && this.currentAuthToken === authToken) {
        return this.socket;
      }
      this.disconnect();
    }

    this.currentAuthToken = authToken;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: authToken,
      },
      extraHeaders: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this._emitLocal('connect', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._emitLocal('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this._emitLocal('connect_error', error);
    });

    // Register forwarded backend chat events
    const chatEvents = [
      'chat:joined',
      'chat:message',
      'chat:typing',
      'chat:user_joined',
      'chat:user_left',
      'chat:error',
    ];

    chatEvents.forEach((eventName) => {
      this.socket.on(eventName, (data) => {
        this._emitLocal(eventName, data);
      });
    });

    return this.socket;
  }

  /**
   * Disconnects active socket and clears local listeners.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Joins or resumes a customer live chat session.
   */
  joinChat(subject = 'Customer General Support', callback, existingSessionId = null, customerMeta = null) {
    if (!this.socket) this.connect();
    const payload = {
      subject,
      ...(existingSessionId ? { sessionId: existingSessionId } : {}),
      ...(customerMeta ? customerMeta : {}),
    };
    this.socket.emit('chat:join', payload, (response) => {
      if (typeof callback === 'function') callback(response);
    });
  }

  /**
   * Dispatches a message to the active session.
   */
  sendMessage(sessionId, message, callback) {
    if (!this.socket) this.connect();
    this.socket.emit('chat:message', { sessionId, message }, (response) => {
      if (typeof callback === 'function') callback(response);
    });
  }

  /**
   * Dispatches a typing state indicator to counterpart.
   */
  sendTyping(sessionId, isTyping) {
    if (!this.socket) return;
    this.socket.emit('chat:typing', { sessionId, isTyping });
  }

  /**
   * Leaves active chat session room.
   */
  leaveChat(sessionId, callback) {
    if (!this.socket) return;
    this.socket.emit('chat:leave', { sessionId }, (response) => {
      if (typeof callback === 'function') callback(response);
    });
  }

  /**
   * Subscribes a listener to a chat event.
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);

    // Also attach directly to socket if connected
    if (this.socket) {
      this.socket.on(event, handler);
    }

    return () => this.off(event, handler);
  }

  /**
   * Removes an existing listener.
   */
  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  _emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[SocketService] Error in listener for ${event}:`, e);
        }
      });
    }
  }
}

export const socketService = new SocketService();
export default socketService;
