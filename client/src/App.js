import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TimeTrackingProvider } from './contexts/TimeTrackingContext';
import { DashboardProvider } from './contexts/DashboardContext';

// Import essential components (not lazy loaded)
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import VersionInfo from './components/VersionInfo';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));
const ListView = lazy(() => import('./pages/ListView'));
const GanttChart = lazy(() => import('./components/GanttChart'));
const Files = lazy(() => import('./pages/Files'));
const Chat = lazy(() => import('./pages/Chat'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const MarketingKanban = lazy(() => import('./pages/MarketingKanban'));
const MarketingList = lazy(() => import('./pages/MarketingList'));
const SalesKanban = lazy(() => import('./pages/SalesKanban'));
const SalesList = lazy(() => import('./pages/SalesList'));
const FeatureDemo = lazy(() => import('./components/FeatureDemo'));
const Automation = lazy(() => import('./pages/Automation'));
const DashboardBuilder = lazy(() => import('./pages/DashboardBuilder'));
const CustomDashboard = lazy(() => import('./pages/CustomDashboard'));

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
          <ThemeProvider>
            <AuthProvider>
              <TimeTrackingProvider>
                <DashboardProvider>
                  <SocketProvider>
                  <Router>
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
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
              </div>
            }>
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
                  <Route path="projects/:projectId/gantt" element={<GanttChart />} />
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
                  
                  {/* Automation Routes */}
                  <Route path="automation" element={<Automation />} />
                  
                  {/* Dashboard Builder Route */}
                  <Route path="dashboard-builder" element={<DashboardBuilder />} />
                  
                  {/* Custom Dashboard Route */}
                  <Route path="custom-dashboard" element={<CustomDashboard />} />
                  
                  {/* Settings Routes */}
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/:tab" element={<Settings />} />
                  
                  {/* Feature Demo Route */}
                  <Route path="demo" element={<FeatureDemo />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            <VersionInfo />
            </div>
                  </Router>
                </SocketProvider>
                </DashboardProvider>
              </TimeTrackingProvider>
            </AuthProvider>
          </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
