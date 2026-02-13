import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session immediately
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // 2. Listen for changes (Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // Optional: Show a blank screen or spinner while checking
    return <div style={{height: '100vh', background: '#f8f9fa'}}></div>; 
  }

  if (!session) {
    // If NOT logged in, kick them to Sign In
    return <Navigate to="/signin" replace />;
  }

  // ✅ CRITICAL: If logged in, render the requested page (children)
  // If you had <Dashboard /> here by mistake, that explains the bug!
  return children;
};

export default ProtectedRoute;