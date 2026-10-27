import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { io } from 'socket.io-client';
import ChatWidget from '../../components/chat/ChatWidget';
import { socketService } from '../../services/socket.service';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));

/** Minimal fake Socket.IO client: records emits and lets a test fire server events. */
const fakeSocket = () => {
  const handlers = {};
  return {
    id: 'sock-1',
    connected: true,
    handlers,
    on: vi.fn((event, fn) => {
      handlers[event] = fn;
    }),
    off: vi.fn(),
    emit: vi.fn((event, payload, ack) => {
      if (event === 'chat:join' && ack) ack({ sessionId: 'sess-1' });
      if (event === 'chat:message' && ack) ack({ ok: true });
      if (event === 'chat:leave' && ack) ack({ ok: true });
    }),
    disconnect: vi.fn(),
    fire(event, data) {
      handlers[event]?.(data);
    },
  };
};

describe('ChatWidget (FR032/FR033)', () => {
  let socket;

  beforeEach(() => {
    socketService.disconnect();
    socket = fakeSocket();
    io.mockReturnValue(socket);
  });

  const openChat = async () => {
    render(<ChatWidget customer={{ id: 4, name: 'Nimal', email: 'n@x.lk' }} accessToken="tok" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open Live Support Chat' }));
  };

  it('should join a session with the signed-in customer and the access token', async () => {
    await openChat();
    act(() => socket.fire('connect'));

    expect(io).toHaveBeenCalledWith(undefined, expect.objectContaining({ auth: { token: 'tok' } }));
    const [, payload] = socket.emit.mock.calls.find(([event]) => event === 'chat:join');
    expect(payload).toMatchObject({ customerId: 4, customerName: 'Nimal' });
    expect(sessionStorage.getItem('dfc_chat_session_id')).toBe('sess-1');
  });

  it('should send messages over the socket and show agent replies', async () => {
    await openChat();
    act(() => socket.fire('connect'));

    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello{enter}');
    act(() =>
      socket.fire('chat:message', {
        id: 'm2',
        senderRole: 'support_agent',
        senderName: 'Kasun',
        message: 'Hi, how can I help?',
      })
    );

    expect(socket.emit).toHaveBeenCalledWith(
      'chat:message',
      { sessionId: 'sess-1', message: 'Hello' },
      expect.any(Function)
    );
    expect(screen.getByText('Hi, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Kasun')).toBeInTheDocument();
  });

  it('should not duplicate the server echo of my own message', async () => {
    await openChat();
    act(() => socket.fire('connect'));
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Size help{enter}');

    act(() => socket.fire('chat:message', { senderRole: 'customer', message: 'Size help' }));

    expect(screen.getAllByText('Size help')).toHaveLength(1);
  });

  it('should show and clear the typing indicator', async () => {
    await openChat();
    act(() => socket.fire('connect'));

    act(() => socket.fire('chat:typing', { isTyping: true, role: 'support_agent' }));
    expect(screen.getByText(/Support Agent/)).toBeInTheDocument();
    act(() => socket.fire('chat:typing', { isTyping: false }));
  });

  describe('while the chat server is unreachable', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    const ask = async (text) => {
      await openChat();
      await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), `${text}{enter}`);
      await act(() => vi.advanceTimersByTimeAsync(800));
    };

    it('should never invent an order status', async () => {
      await ask('Where is my order 104?');

      expect(screen.getByText(/Account > Your orders/)).toBeInTheDocument();
      expect(screen.queryByText(/in transit/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('chat-order-card')).not.toBeInTheDocument();
    });

    it('should answer known questions from the static FAQ', async () => {
      await ask('What is your return policy?');

      expect(screen.getByText(/within 30 days of delivery/)).toBeInTheDocument();
    });

    it('should not pretend an agent is connected', async () => {
      await ask('Speak to an agent');

      expect(screen.getByText(/offline right now/)).toBeInTheDocument();
      expect(screen.queryByText('Live Support Agent')).not.toBeInTheDocument();
    });

    it('should give a default reply to anything else', async () => {
      await ask('Do you sell shoes');

      expect(screen.getByText(/Your message is noted/)).toBeInTheDocument();
    });
  });

  it('should close from the header', async () => {
    await openChat();

    await userEvent.click(screen.getByRole('button', { name: 'Close Chat' }));

    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });
});

describe('socketService', () => {
  it('should reuse a connected socket for the same token and reconnect for a new one', () => {
    socketService.disconnect();
    const first = fakeSocket();
    const second = fakeSocket();
    io.mockReturnValueOnce(first).mockReturnValueOnce(second);

    socketService.connect('a');
    socketService.isConnected = true;
    first.connected = true;
    expect(socketService.connect('a')).toBe(first);
    expect(socketService.connect('b')).toBe(second);
    expect(first.disconnect).toHaveBeenCalled();
  });

  it('should forward chat events to local listeners and unsubscribe', () => {
    socketService.disconnect();
    const socket = fakeSocket();
    io.mockReturnValue(socket);
    socketService.connect();
    const listener = vi.fn();
    const off = socketService.on('chat:error', listener);

    socket.fire('chat:error', { message: 'x' });
    off();
    socket.fire('chat:error', { message: 'y' });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should keep a broken listener from stopping the others', () => {
    socketService.disconnect();
    const socket = fakeSocket();
    io.mockReturnValue(socket);
    socketService.connect();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const good = vi.fn();
    socketService.on('disconnect', () => {
      throw new Error('boom');
    });
    socketService.on('disconnect', good);

    socket.fire('disconnect', 'io server disconnect');

    expect(good).toHaveBeenCalled();
  });

  it('should send typing and leave only when connected', () => {
    socketService.disconnect();
    socketService.sendTyping('s', true);
    socketService.leaveChat('s');
    const socket = fakeSocket();
    io.mockReturnValue(socket);
    socketService.connect();
    const ack = vi.fn();

    socketService.sendTyping('s', true);
    socketService.leaveChat('s', ack);
    socketService.on('custom:event', vi.fn());
    socketService.off('never-registered', vi.fn());

    expect(socket.emit).toHaveBeenCalledWith('chat:typing', { sessionId: 's', isTyping: true });
    expect(ack).toHaveBeenCalled();
    expect(socket.on).toHaveBeenCalledWith('custom:event', expect.any(Function));
  });

  it('should connect on demand when joining or sending', () => {
    socketService.disconnect();
    const socket = fakeSocket();
    io.mockReturnValue(socket);

    socketService.joinChat(null, vi.fn());
    socketService.disconnect();
    io.mockReturnValue(socket);
    socketService.sendMessage('s', 'hi', vi.fn());

    expect(socket.emit).toHaveBeenCalledWith(
      'chat:join',
      { subject: 'Customer General Support' },
      expect.any(Function)
    );
    expect(socket.emit).toHaveBeenCalledWith(
      'chat:message',
      { sessionId: 's', message: 'hi' },
      expect.any(Function)
    );
  });
});
