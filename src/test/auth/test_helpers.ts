/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Auth test context type
export interface AuthContext {
  request: {
    headers: Headers;
    method?: string;
  };
  state: Record<string, unknown> & {
    user?: {
      id: string;
      role: string;
    };
  };
}

// Create mock context for auth tests
export function createAuthContext(options: {
  token?: string;
  method?: string;
  role?: string;
} = {}): AuthContext {
  const headers = new Headers();
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  return {
    request: {
      headers,
      method: options.method || 'GET'
    },
    state: options.role ? {
      user: {
        id: 'test-user-id',
        role: options.role
      }
    } : {}
  };
}

// Test data for auth tests
export const authTestData = {
  validToken: 'valid-token',
  invalidToken: 'invalid-token',
  expiredToken: 'expired-token',
  users: {
    admin: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      role: 'admin'
    },
    regular: {
      id: 'test-user-id',
      email: 'user@example.com',
      role: 'user'
    }
  }
};
