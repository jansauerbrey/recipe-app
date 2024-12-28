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
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import UnitsPage from './pages/units/UnitsPage';
import CreateUnitPage from './pages/units/CreateUnitPage';
import EditUnitPage from './pages/units/EditUnitPage';
import DishTypesPage from './pages/dishtypes/DishTypesPage';
import CreateDishTypePage from './pages/dishtypes/CreateDishTypePage';
import EditDishTypePage from './pages/dishtypes/EditDishTypePage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CreateCategoryPage from './pages/categories/CreateCategoryPage';
import EditCategoryPage from './pages/categories/EditCategoryPage';
import IngredientsPage from './pages/ingredients/IngredientsPage';
import CreateIngredientPage from './pages/ingredients/CreateIngredientPage';
import EditIngredientPage from './pages/ingredients/EditIngredientPage';

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
  // We might need location later for navigation state management
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected routes with MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Home route */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />

        {/* Recipe routes */}
        <Route path="recipes">
          <Route index element={<RecipesPage />} />
          <Route path="new" element={<CreateRecipePage />} />
          <Route path=":id" element={<RecipeDetailPage />} />
          <Route path="filter" element={<RecipesPage />} />
        </Route>

        {/* Other protected routes */}
        <Route path="schedules/*" element={<div>Schedules (Coming Soon)</div>} />
        <Route path="shopping/*" element={<div>Shopping Lists (Coming Soon)</div>} />
        <Route path="settings/*" element={<div>Settings (Coming Soon)</div>} />

        {/* Admin routes */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <Routes>
                <Route path="units">
                  <Route index element={<UnitsPage />} />
                  <Route path="create" element={<CreateUnitPage />} />
                  <Route path="edit/:id" element={<EditUnitPage />} />
                </Route>
                <Route path="ingredients">
                  <Route index element={<IngredientsPage />} />
                  <Route path="create" element={<CreateIngredientPage />} />
                  <Route path="edit/:id" element={<EditIngredientPage />} />
                </Route>
                <Route path="categories">
                  <Route index element={<CategoriesPage />} />
                  <Route path="create" element={<CreateCategoryPage />} />
                  <Route path="edit/:id" element={<EditCategoryPage />} />
                </Route>
                <Route path="tags/*" element={<div>Tags Management (Coming Soon)</div>} />
                <Route path="dishtypes">
                  <Route index element={<DishTypesPage />} />
                  <Route path="create" element={<CreateDishTypePage />} />
                  <Route path="edit/:id" element={<EditDishTypePage />} />
                </Route>
                <Route path="users/*" element={<div>Users Management (Coming Soon)</div>} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Logout route */}
        <Route path="logout" element={<div>Logging out...</div>} />
      </Route>

      {/* Public routes that use MainLayout */}
      <Route element={<MainLayout />}>
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
