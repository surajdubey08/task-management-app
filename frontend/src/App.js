import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import LoadingSpinner from './components/LoadingSpinner';
import { SkipLink, LiveRegion } from './hooks/useAccessibility';
import { useScreenReader, useServiceWorker } from './hooks/useAccessibility';
import { usePWA } from './hooks/usePWA';
// Authentication pages
import Login from './pages/Login';
import Register from './pages/Register';
// Protected pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import KanbanView from './pages/KanbanView';
import EnhancedKanbanView from './pages/EnhancedKanbanView';
import Users from './pages/Users';
import Categories from './pages/Categories';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';
import CreateCategory from './pages/CreateCategory';
import EditCategory from './pages/EditCategory';

// Create a client with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Main App Router component
const AppRouter = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { announcements } = useScreenReader();
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const { isInstallable, installApp } = usePWA();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show update notification
  useEffect(() => {
    if (updateAvailable) {
      // You could show a toast or banner here
      console.log('App update available');
    }
  }, [updateAvailable]);

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion announcements={announcements} />
      
      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-2 text-center text-sm z-50">
          <span>Install TaskFlow for a better experience! </span>
          <button 
            onClick={installApp}
            className="underline hover:no-underline ml-2"
          >
            Install Now
          </button>
        </div>
      )}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/kanban" element={<KanbanView />} />
                <Route path="/kanban/enhanced" element={<EnhancedKanbanView />} />
                <Route path="/tasks/new" element={<CreateTask />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/tasks/:id/edit" element={<EditTask />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<CreateUser />} />
                <Route path="/users/:id/edit" element={<EditUser />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/new" element={<CreateCategory />} />
                <Route path="/categories/:id/edit" element={<EditCategory />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* Command Palette - Only show when authenticated */}
      <ProtectedRoute fallback={null}>
        <CommandPalette 
          isOpen={commandPaletteOpen} 
          onClose={() => setCommandPaletteOpen(false)} 
        />
      </ProtectedRoute>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <AppRouter />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
      
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
