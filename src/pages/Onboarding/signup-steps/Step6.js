import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Step6 = ({ formData, handleChange, nextStep, prevStep }) => {
  return (
    <div className="signup-step-container">
      <div className="top-bar">
        <button className="back-btn" onClick={prevStep}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      <div className="header-section">
        <h1>Profile Setup</h1>
      </div>

      <div className="form-section">
        <input
          type="text"
          name="emergencyName"
          placeholder="Emergency Contact Name"
          value={formData.emergencyName}
          onChange={handleChange}
          className="custom-input"
        />

        <input
          type="tel"
          name="emergencyPhone"
          placeholder="Emergency Contact Phone"
          value={formData.emergencyPhone}
          onChange={handleChange}
          className="custom-input"
        />

        <p className="encryption-notice">
          This information is encrypted and only accessible to you and authorized 
          healthcare providers in case of emergency.
        </p>
      </div>

      <div className="footer-section">
        <div className="step-count">3/3</div>
        <button className="btn-signin-large" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Step6;