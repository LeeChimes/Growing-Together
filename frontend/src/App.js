import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export useAuth for components
export { useAuth };

// Components
import Navigation from './components/Navigation';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import DiaryScreen from './components/DiaryScreen';
import EventsScreen from './components/EventsScreen';
import CommunityScreen from './components/CommunityScreen';
import EnhancedGalleryScreen from './components/EnhancedGalleryScreen';
import TasksScreen from './components/TasksScreen';
import PlantLibraryScreen from './components/PlantLibraryScreen';
import AdminScreen from './components/AdminScreen';
import SettingsScreen from './components/SettingsScreen';

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add a small delay to ensure axios interceptor is set up
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear token if it's actually invalid, not on network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isApproved: user?.role !== 'guest'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Main App Layout
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <Navigation />
      <main className="pb-20">
        {children}
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Route */}
            <Route 
              path="/auth" 
              element={
                <AuthContext.Consumer>
                  {({ user }) => 
                    user ? <Navigate to="/" replace /> : <AuthScreen />
                  }
                </AuthContext.Consumer>
              } 
            />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <HomeScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/diary" element={
              <ProtectedRoute>
                <AppLayout>
                  <DiaryScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/events" element={
              <ProtectedRoute>
                <AppLayout>
                  <EventsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/community" element={
              <ProtectedRoute>
                <AppLayout>
                  <CommunityScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/gallery" element={
              <ProtectedRoute>
                <AppLayout>
                  <EnhancedGalleryScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/tasks" element={
              <ProtectedRoute>
                <AppLayout>
                  <TasksScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/plants" element={
              <ProtectedRoute>
                <AppLayout>
                  <PlantLibraryScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminScreen />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;