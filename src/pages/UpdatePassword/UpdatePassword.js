import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // Adjust this path if your supabase.js is elsewhere
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Using one of your existing avatars for the CatchUp branding
import avatar1 from '../../assets/avatar1.png'; 

import './UpdatePassword.css';

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // <-- Added state to block the page while checking
  const navigate = useNavigate();

  // Verify the user actually arrived here with a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session? They typed the URL manually or the link expired. Kick them to signin!
        navigate('/signin'); 
      } else {
        // Valid session! Let them see the form.
        setIsChecking(false);
      }
    };
    
    checkSession();

    // Catch the specific password recovery event just in case
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsChecking(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage("Password updated successfully! Redirecting to login...");
      // Changed to redirect to the login page after 2 seconds
      setTimeout(() => navigate('/signin'), 2000); 
    }
  };

  // Prevent the form from flashing on the screen while we check their credentials
  if (isChecking) {
    return (
      <div className="auth-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#E64A45', fontWeight: 'bold', fontSize: '1.2rem' }}>Verifying secure link...</p>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-avatar-wrapper">
            <img src={avatar1} alt="CatchUp Tomato" className="auth-avatar" />
          </div>
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Your new password must be different from previously used passwords.</p>
        </div>

        <form className="auth-form" onSubmit={handleUpdatePassword}>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className="status-message error">
              <FiAlertCircle /> {errorMsg}
            </div>
          )}

          {message && (
            <div className="status-message success">
              <FiCheckCircle /> {message}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading || !!errorMsg.includes("expired")}
          >
            {isLoading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;