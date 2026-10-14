/**
 * Picks the service implementation. Set EXPO_PUBLIC_API_MODE=http and
 * EXPO_PUBLIC_API_URL once the backend is live (see .env.example).
 */
import { createMockServices } from './mock';
import type { Services } from './types';

export const API_MODE = process.env.EXPO_PUBLIC_API_MODE ?? 'mock';

let services: Services | null = null;

export function getServices(): Services {
  if (!services) {
    if (API_MODE !== 'mock') {
      // HTTP services are not written yet: the app falls back to mocks.
      console.warn('[CongoMatch] EXPO_PUBLIC_API_MODE=http is not implemented yet, using mocks.');
    }
    services = createMockServices();
  }
  return services;
}

export * from './types';
