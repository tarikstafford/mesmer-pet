import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    expect('hello').toHaveLength(5);
    expect('world').toContain('or');
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
