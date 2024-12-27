import axios, { AxiosError, AxiosInstance } from 'axios';

class ApiClient {
  private api: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
          localStorage.removeItem('auth_token');
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

  // Auth endpoints
  public async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  public async checkAuth() {
    const response = await this.api.get('/user/check');
    return response.data;
  }

  public async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
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

export const api = ApiClient.getInstance();
