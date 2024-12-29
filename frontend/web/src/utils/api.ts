import axios, { AxiosError, AxiosInstance } from 'axios';

function decodeJwt(token: string): { exp: number } | null {
  try {
    // Get the payload part of the JWT (second part)
    const base64Payload = token.split(' ')[1].split('.')[1];
    // Replace URL-safe chars and add padding
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    // Decode
    const jsonPayload = atob(base64 + padding);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

class ApiClient {
  private api: AxiosInstance;
  private static instance: ApiClient;
  private static authToken: string | null = null;
  private static REFRESH_THRESHOLD = 30 * 60; // 30 minutes in seconds

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
    });

    // Add request interceptor to set content type
    this.api.interceptors.request.use(
      (config) => {
        // Let axios set the correct content type for FormData
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add request interceptor for auth token and token refresh
    this.api.interceptors.request.use(
      async (config) => {
        if (ApiClient.authToken) {
          // Check if token needs refresh
          const decoded = decodeJwt(ApiClient.authToken);
          if (decoded?.exp) {
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - now;
            
            // If token will expire within REFRESH_THRESHOLD, refresh it
            if (timeUntilExpiry < ApiClient.REFRESH_THRESHOLD) {
              try {
                const response = await this.api.post<{ token: string }>('/user/refresh', {});
                const newToken = response.data.token;
                ApiClient.authToken = newToken;
                localStorage.setItem('token', newToken);
              } catch (error) {
                console.error('Failed to refresh token:', error);
                // If refresh fails, let the request proceed with old token
                // The response interceptor will handle any 401 errors
              }
            }
          }
          
          // Set the current token (either refreshed or existing)
          config.headers.Authorization = ApiClient.authToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login on 401
          ApiClient.authToken = null;
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public static setAuthToken(token: string | null) {
    ApiClient.authToken = token;
  }

  // Generic request methods
  public async get<T>(url: string) {
    const response = await this.api.get<T>(url);
    return response.data;
  }

  public async post<T>(url: string, data: any) {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data: any) {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  public async delete<T>(url: string) {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

const apiInstance = ApiClient.getInstance();

export const api = {
  get: <T>(url: string) => apiInstance.get<T>(url),
  post: <T>(url: string, data: any) => apiInstance.post<T>(url, data),
  put: <T>(url: string, data: any) => apiInstance.put<T>(url, data),
  delete: <T>(url: string) => apiInstance.delete<T>(url),
  setAuthToken: ApiClient.setAuthToken
};
