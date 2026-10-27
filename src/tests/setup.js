import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement these browser APIs used by the UI.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
