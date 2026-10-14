/**
 * Thin HTTP client for the future API. Each service in `src/services/types.ts`
 * gets an HTTP implementation built on this, e.g.:
 *
 *   export const httpAuth = (api: ApiClient): AuthService => ({
 *     requestOtp: (country, phone) => api.post('/auth/otp', { country, phone }),
 *     verifyOtp: (requestId, code) => api.post('/auth/otp/verify', { requestId, code }),
 *     signOut: () => api.post('/auth/logout'),
 *   });
 *
 * Endpoints are listed in docs/BACKEND.md.
 */
export type ApiClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  setToken(token: string | null): void;
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function createApiClient(baseUrl: string): ApiClient {
  let token: string | null = null;
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data.code ?? 'ERROR', data.message ?? 'Erreur réseau');
    return data as T;
  }
  return {
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b),
    patch: (p, b) => call('PATCH', p, b),
    setToken: (t) => {
      token = t;
    },
  };
}
