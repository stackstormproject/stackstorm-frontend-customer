import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import App from './App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('App', () => {
  it('should render the StackStorm heading given the App component is mounted', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.querySelector('h1').textContent).toBe('StackStorm');

    await act(async () => {
      root.unmount();
    });

    container.remove();
  });
});
