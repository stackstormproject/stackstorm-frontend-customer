import '@testing-library/jest-dom/vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(axeMatchers);

// Node 24 (the CI runtime) builds Request with its own fetch, which rejects jsdom's
// AbortSignal. React Router creates a Request for every navigation, so without this every
// redirect and link fails in tests while passing on Node 22. Tests never abort a
// navigation, so the signal is dropped before it reaches Node's Request.
const NodeRequest = globalThis.Request;
globalThis.Request = class Request extends NodeRequest {
  constructor(input, init = {}) {
    const { signal, ...rest } = init;
    super(input, rest);
  }
};

// jsdom does not implement these browser APIs used by the UI.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
