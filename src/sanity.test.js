import { describe, it, expect } from 'vitest';

describe('test framework', () => {
  it('should run a basic assertion given a working Vitest setup', () => {
    expect(1 + 1).toBe(2);
  });
});
