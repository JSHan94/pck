import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Shared package structure', () => {
  it('should have shared directory', () => {
    const sharedDir = join(__dirname, '..');
    expect(existsSync(sharedDir)).toBe(true);
  });
});
