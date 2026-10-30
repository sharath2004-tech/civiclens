import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/citizen/Dashboard';
import ReportIssue from './pages/citizen/ReportIssue';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import ExploreMap from './pages/citizen/ExploreMap';
import Profile from './pages/citizen/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AllComplaints from './pages/admin/AllComplaints';
import PriorityQueue from './pages/admin/PriorityQueue';
import Departments from './pages/admin/Departments';
import Workers from './pages/admin/Workers';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

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
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />

        {/* Citizen & Shared Routes */}
        <Route path="/dashboard" element={user ? <CitizenDashboard /> : <Navigate to="/login" />} />
        <Route path="/report" element={user ? <ReportIssue /> : <Navigate to="/login" />} />
        <Route path="/my-complaints" element={user ? <MyComplaints /> : <Navigate to="/login" />} />
        <Route path="/complaint/:id" element={user ? <ComplaintDetails roleProp={user?.role} /> : <Navigate to="/login" />} />
        <Route path="/explore" element={<ExploreMap />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin/complaints" element={user?.role === 'admin' ? <AllComplaints /> : <Navigate to="/login" />} />
        <Route path="/admin/map" element={user?.role === 'admin' ? <ExploreMap /> : <Navigate to="/login" />} />
        <Route path="/admin/priority-queue" element={user?.role === 'admin' ? <PriorityQueue /> : <Navigate to="/login" />} />
        <Route path="/admin/departments" element={user?.role === 'admin' ? <Departments /> : <Navigate to="/login" />} />
        <Route path="/admin/workers" element={user?.role === 'admin' ? <Workers /> : <Navigate to="/login" />} />
        <Route path="/admin/analytics" element={user?.role === 'admin' ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/admin/settings" element={user?.role === 'admin' ? <Settings /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
