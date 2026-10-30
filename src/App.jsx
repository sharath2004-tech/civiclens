import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Pages (lazy-loaded so each screen downloads only its own code — faster startup)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CitizenDashboard = lazy(() => import('./pages/citizen/Dashboard'));
const ReportIssue = lazy(() => import('./pages/citizen/ReportIssue'));
const MyComplaints = lazy(() => import('./pages/citizen/MyComplaints'));
const ComplaintDetails = lazy(() => import('./pages/citizen/ComplaintDetails'));
const ExploreMap = lazy(() => import('./pages/citizen/ExploreMap'));
const Profile = lazy(() => import('./pages/citizen/Profile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AllComplaints = lazy(() => import('./pages/admin/AllComplaints'));
const PriorityQueue = lazy(() => import('./pages/admin/PriorityQueue'));
const Departments = lazy(() => import('./pages/admin/Departments'));
const Workers = lazy(() => import('./pages/admin/Workers'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Settings = lazy(() => import('./pages/admin/Settings'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function BackButtonGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.__handleAndroidBack = () => {
      if (typeof window.__handleStepBack === 'function') {
        const stepHandled = window.__handleStepBack();
        if (stepHandled === 'HANDLED') return 'HANDLED';
      }
      const path = location.pathname;
      if (path === '/' || path === '/dashboard') {
        return 'ROOT';
      }
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        const hasToken = Boolean(localStorage.getItem('token'));
        navigate(hasToken ? '/dashboard' : '/', { replace: true });
      }
      return 'HANDLED';
    };
    return () => {
      delete window.__handleAndroidBack;
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  return (
    <Router>
      <BackButtonGuard />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />

        {/* Citizen & Shared Routes */}
        <Route path="/dashboard" element={user ? <CitizenDashboard /> : <Navigate to="/login" />} />
        <Route path="/report" element={user ? <ReportIssue /> : <Navigate to="/login" />} />
        <Route path="/my-complaints" element={user ? <MyComplaints /> : <Navigate to="/login" />} />
        <Route path="/complaint/:id" element={<ComplaintDetails roleProp={user?.role || 'citizen'} />} />
        <Route path="/complaints/:id" element={<ComplaintDetails roleProp={user?.role || 'citizen'} />} />
        <Route path="/explore" element={<ExploreMap />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Admin Routes - Protected */}
        <Route 
          path="/admin" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <AdminDashboard /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/complaints" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <AllComplaints /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/map" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <ExploreMap /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/priority-queue" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <PriorityQueue /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/departments" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <Departments /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/workers" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <Workers /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <Analytics /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            user?.role === 'admin' || user?.role === 'worker' 
              ? <Settings /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
