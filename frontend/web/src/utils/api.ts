import axios, { AxiosError, AxiosInstance } from 'axios';

class ApiClient {
  private api: AxiosInstance;
  private static instance: ApiClient;
  private static authToken: string | null = null;

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

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (ApiClient.authToken) {
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
          ApiClient.authToken = null;
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
