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
        <Route path="/complaint/:id" element={<ComplaintDetails roleProp={user?.role || 'citizen'} />} />
        <Route path="/complaints/:id" element={<ComplaintDetails roleProp={user?.role || 'citizen'} />} />
        <Route path="/explore" element={<ExploreMap />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AllComplaints />} />
        <Route path="/admin/map" element={<ExploreMap />} />
        <Route path="/admin/priority-queue" element={<PriorityQueue />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/workers" element={<Workers />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
