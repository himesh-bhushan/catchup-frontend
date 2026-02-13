import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Step5 = ({ formData, handleChange, nextStep, prevStep }) => {
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
        {/* Current Medication */}
        <div className="input-group">
          <label className="input-label">Current Medication</label>
          <textarea
            name="medications"
            placeholder="List any medications you're currently taking..."
            value={formData.medications}
            onChange={handleChange}
            className="custom-textarea"
            rows="4"
          />
        </div>

        {/* Allergies */}
        <div className="input-group" style={{ marginTop: '20px' }}>
          <label className="input-label">Allergies</label>
          <textarea
            name="allergies"
            placeholder="List any allergies (medications, food, etc...)"
            value={formData.allergies}
            onChange={handleChange}
            className="custom-textarea"
            rows="4"
          />
        </div>
      </div>

      <div className="footer-section">
        <div className="step-count">2/3</div>
        <button className="btn-signin-large" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Step5;