import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import tomatoHero from '../../assets/raise-hand.png'; 
import '../../styles/Signin.css';

// --- ✅ SUPABASE IMPORT (Replaces Firebase) ---
import { supabase } from '../../supabase';

const Signin = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback states
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIN LOGIC (Supabase) ---
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in both fields.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      console.log("Logged In Successfully!");

      // 2. Fetch Name for Dashboard "Hello [Name]"
      if (data.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', data.user.id)
            .single();

        if (profile?.first_name) {
            localStorage.setItem('userName', profile.first_name);
        }
        
        // 3. Redirect
        navigate('/dashboard'); 
      }

    } catch (err) {
      console.error("Login Error:", err.message);
      if (err.message.includes("Invalid login credentials")) {
        setError('Incorrect email or password.');
      } else {
        setError(err.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD LOGIC (Supabase) ---
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address above first.");
      return;
    }
    
    try {
      // Supabase Password Reset
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: 'http://localhost:3000/reset-password', // Change if your URL differs
      });

      if (error) throw error;

      setMessage("Password reset email sent! Check your inbox.");
      setError('');
    } catch (err) {
      console.error(err);
      setError("Could not send reset email. Verify the address is correct.");
    }
  };

  return (
    <div className="signin-page-wrapper">
      
      {/* LEFT SIDE: Hero Section */}
      <div className="signin-hero-side">
        <h1>
          Time to<br />
          “ketchup” on<br />
          your wellness
        </h1>
        <img src={tomatoHero} alt="Tomato Hero" />
      </div>

      {/* RIGHT SIDE: Form Section */}
      <div className="signin-form-side">
        <div className="signin-container">
          
          {/* Top Bar */}
          <div className="top-bar">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <FiArrowLeft size={24} color="#000" />
            </button>
          </div>

          {/* Header Text */}
          <div className="header-section">
            <h1>Hello.</h1>
            <p>Welcome back!</p>
          </div>

          {/* Error / Success Messages */}
          {error && <div style={{color: 'red', fontSize: '14px', marginBottom: '10px'}}>{error}</div>}
          {message && <div style={{color: 'green', fontSize: '14px', marginBottom: '10px'}}>{message}</div>}

          {/* Input Form */}
          <div className="form-section">
            <div className="input-group">
              <input 
                type="email"
                name="email" 
                placeholder="Email Address" 
                className="custom-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group password-group">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="Password" 
                className="custom-input"
                value={formData.password}
                onChange={handleChange}
              />
              <span 
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{cursor: 'pointer'}}
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </span>
            </div>

            <div className="forgot-password-container">
              <button 
                className="forgot-password-btn" 
                onClick={handleForgotPassword}
              >
                Forgot Your Password?
              </button>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="footer-section">
            <button className="btn-signin-large" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <p className="signup-link">
              Don't have an account? <span onClick={() => navigate('/signup')} style={{cursor: 'pointer', fontWeight: 'bold'}}>Sign up</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signin;