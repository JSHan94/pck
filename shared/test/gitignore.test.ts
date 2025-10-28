import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('.gitignore files', () => {
  it('should have .gitignore in root directory', () => {
    const rootGitignore = join(__dirname, '..', '..', '.gitignore');
    expect(existsSync(rootGitignore)).toBe(true);
  });

  it('should have .gitignore in shared directory', () => {
    const sharedGitignore = join(__dirname, '..', '.gitignore');
    expect(existsSync(sharedGitignore)).toBe(true);
  });

  it('should have .gitignore in frontend directory', () => {
    const frontendGitignore = join(__dirname, '..', '..', 'frontend', '.gitignore');
    expect(existsSync(frontendGitignore)).toBe(true);
  });

  it('should have .gitignore in backend directory', () => {
    const backendGitignore = join(__dirname, '..', '..', 'backend', '.gitignore');
    expect(existsSync(backendGitignore)).toBe(true);
  });

  it('should have .gitignore in contract directory', () => {
    const contractGitignore = join(__dirname, '..', '..', 'contract', '.gitignore');
    expect(existsSync(contractGitignore)).toBe(true);
  });
});
