import React from 'react';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const Step1Account = ({ formData, handleChange, nextStep, navigate }) => {
  const [showPass, setShowPass] = React.useState(false);

  return (
    <div className="signup-step-container">
      {/* Top Bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      {/* Header [cite: 8, 9] */}
      <div className="header-section">
        <h1>Let's Sign you up.</h1>
        <p>Welcome to join us!</p>
      </div>

      {/* Form Fields [cite: 10-12] */}
      <div className="form-section">
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="custom-input"
        />
        
        <div className="input-group password-group">
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="custom-input"
          />
          <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
            {showPass ? <FiEye /> : <FiEyeOff />}
          </span>
        </div>

        <div className="input-group password-group">
          <input
            type={showPass ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="custom-input"
          />
        </div>
      </div>

      {/* Footer [cite: 13, 14] */}
      <div className="footer-section">
        <button className="btn-signin-large" onClick={nextStep}>
          Sign up
        </button>
        <p className="terms-text">
          By continuing, you agree to CatchUp's <br/>
          <strong>Terms of Service</strong> and <strong>Privacy Policies</strong>.
        </p>
      </div>
    </div>
  );
};

export default Step1Account;