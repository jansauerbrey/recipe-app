import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { NavigationTitleProvider } from './contexts/NavigationTitleContext';
import { PreviousStateProvider } from './contexts/PreviousStateContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { RecipesPage } from './pages/RecipesPage';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const location = useLocation();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Main Layout routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute isPublic={location.pathname === '/impressum'}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="recipes/:dishTypeSlug?" element={<RecipesPage />} />
        <Route path="schedules/*" element={<div>Schedules (Coming Soon)</div>} />
        <Route path="shopping/*" element={<div>Shopping Lists (Coming Soon)</div>} />
        <Route path="settings/*" element={<div>Settings (Coming Soon)</div>} />
        
        {/* Admin routes */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <Routes>
                <Route path="units/*" element={<div>Units Management (Coming Soon)</div>} />
                <Route path="ingredients/*" element={<div>Ingredients Management (Coming Soon)</div>} />
                <Route path="tags/*" element={<div>Tags Management (Coming Soon)</div>} />
                <Route path="dishtypes/*" element={<div>Dish Types Management (Coming Soon)</div>} />
                <Route path="users/*" element={<div>Users Management (Coming Soon)</div>} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Logout route */}
        <Route path="logout" element={<div>Logging out...</div>} />
        
        {/* Public routes that use MainLayout */}
        <Route path="impressum" element={<ImpressumPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <AuthProvider>
            <PreviousStateProvider>
              <NavigationTitleProvider>
                {children}
              </NavigationTitleProvider>
            </PreviousStateProvider>
          </AuthProvider>
        </MantineProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
