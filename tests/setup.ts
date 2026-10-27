import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { tokenStore } from '@/lib/api/tokenStore';

afterEach(() => {
  cleanup();
  tokenStore.clear();
  globalThis.localStorage?.clear();
});
