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

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
        
        {/* Citizen Routes */}
        <Route path="/dashboard" element={user ? <CitizenDashboard /> : <Navigate to="/login" />} />
        <Route path="/report" element={user ? <ReportIssue /> : <Navigate to="/login" />} />
        <Route path="/my-complaints" element={user ? <MyComplaints /> : <Navigate to="/login" />} />
        <Route path="/complaint/:id" element={user ? <ComplaintDetails /> : <Navigate to="/login" />} />
        <Route path="/explore" element={<ExploreMap />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin/complaints" element={user?.role === 'admin' ? <AllComplaints /> : <Navigate to="/login" />} />
        <Route path="/admin/priority-queue" element={user?.role === 'admin' ? <PriorityQueue /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
