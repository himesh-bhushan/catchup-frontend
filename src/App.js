import React, { useState, useEffect } from 'react';
// ✅ REMOVE 'BrowserRouter as Router' from imports
import { Routes, Route, Navigate } from 'react-router-dom'; 

// Pages
import Welcome from './pages/Onboarding/Welcome';
import Signin from './pages/Onboarding/Signin';
import Signup from './pages/Onboarding/Signup';
import Dashboard from './pages/Dashboard/Dashboard';

// Profile Layout
import ProfileLayout from './pages/Profile/ProfileLayout'; 

// Features
import Report from './pages/Report/Report';
import Sharing from './pages/Sharing/Sharing';
import Chatbox from './pages/Chatbox/Chatbox';
import Activity from './pages/Activity/Activity';
import Goals from './pages/Goals/Goals';
import BloodPressure from './pages/Features/BloodPressure';
import HeartRate from './pages/Features/HeartRate';

import './App.css'; 
import PanicButton from './components/PanicButton';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop ? <Signin /> : <Welcome />;
};

function App() {
  useEffect(() => { document.title = "CatchUp"; }, []);

  return (
    // ❌ REMOVED <Router> TAG HERE (It's already in index.js)
    <div className="app-container">
      <PanicButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* Profile Routes */}
        <Route path="/profile/*" element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>} />

        {/* Features */}
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/sharing" element={<ProtectedRoute><Sharing /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><Chatbox /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/blood-pressure" element={<ProtectedRoute><BloodPressure /></ProtectedRoute>} />
        <Route path="/heart-rate" element={<ProtectedRoute><HeartRate /></ProtectedRoute>} />
      </Routes>
    </div>
    // ❌ REMOVED CLOSING </Router> TAG HERE
  );
}

export default App;