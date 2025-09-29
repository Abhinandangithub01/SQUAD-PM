import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TimeTrackingProvider } from './contexts/TimeTrackingContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import KanbanBoard from './pages/KanbanBoard';
import ListView from './pages/ListView';
import Files from './pages/Files';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import MarketingKanban from './pages/MarketingKanban';
import MarketingList from './pages/MarketingList';
import SalesKanban from './pages/SalesKanban';
import SalesList from './pages/SalesList';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <TimeTrackingProvider>
                <SocketProvider>
              <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Task Management Routes */}
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId" element={<ProjectDetail />} />
                  <Route path="projects/:projectId/kanban" element={<KanbanBoard />} />
                  <Route path="projects/:projectId/list" element={<ListView />} />
                  <Route path="projects/:projectId/files" element={<Files />} />
                  
                  {/* Marketing Routes */}
                  <Route path="marketing/kanban" element={<MarketingKanban />} />
                  <Route path="marketing/list" element={<MarketingList />} />
                  
                  {/* Sales Routes */}
                  <Route path="sales/kanban" element={<SalesKanban />} />
                  <Route path="sales/list" element={<SalesList />} />
                  
                  {/* Chat Routes */}
                  <Route path="chat" element={<Chat />} />
                  <Route path="chat/:channelId" element={<Chat />} />
                  
                  {/* Analytics Routes */}
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="analytics/project/:projectId" element={<Analytics />} />
                  
                  {/* Settings Routes */}
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/:tab" element={<Settings />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
                </SocketProvider>
              </TimeTrackingProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
