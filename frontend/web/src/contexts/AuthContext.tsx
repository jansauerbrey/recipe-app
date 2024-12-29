import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  getSubdomain: () => string | null;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  permissions?: string[];
  rolePermissions?: string[];
  settings?: {
    preferredLanguage: string;
    spokenLanguages: string[];
  };
}

interface LoginResponse {
  token: string;
}

interface UserCheckResponse {
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const { user: userData } = await api.get<UserCheckResponse>('/user/check');
        setUser(userData);
      } catch (error) {
        console.error('Failed to check authentication status:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const { token: newToken } = await api.post<LoginResponse>('/user/login', credentials);
      localStorage.setItem('token', newToken);
      // Set token in API client first
      api.setAuthToken(newToken);
      setToken(newToken);
      
      // Now fetch user data with the new token
      const { user: userData } = await api.get<UserCheckResponse>('/user/check');
      setUser(userData);
      
      // Redirect to previous state or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  }, [navigate, location]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        try {
          await api.post('/user/logout', {});
        } catch (error) {
          console.error('Logout failed:', error);
        }
      }
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  }, [navigate, token]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    // Check if user has the permission directly
    if (user.permissions?.includes(permission)) return true;
    // Check if user's role has the permission
    if (user.rolePermissions?.includes(permission)) return true;
    return false;
  }, [user]);

  const getSubdomain = useCallback((): string | null => {
    const host = window.location.hostname;
    if (host.indexOf('.') < 0) return null;
    return host.split('.')[0];
  }, []);

  const value = {
    isAuthenticated,
    isAdmin,
    user,
    token,
    isLoading,
    login,
    logout,
    hasPermission,
    getSubdomain,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
