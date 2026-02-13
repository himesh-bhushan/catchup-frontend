import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Step3 = ({ formData, handleChange, nextStep, prevStep }) => {
  return (
    <div className="signup-step-container">
      {/* Top Bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={prevStep}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      {/* Header */}
      <div className="header-section">
        <h1>Profile Setup</h1>
        <div className="tomato-animation">
             {/* You can add the pushing tomato image here [cite: 27] */}
             🍅
        </div>
      </div>

      <div className="form-section">
        {/* Height [cite: 30] */}
        <div className="input-group">
          <input
            type="number"
            name="height"
            placeholder="Height (cm) *"
            value={formData.height}
            onChange={handleChange}
            className="custom-input"
          />
        </div>

        {/* Weight [cite: 31] */}
        <div className="input-group">
          <input
            type="number"
            name="weight"
            placeholder="Weight (kg) *"
            value={formData.weight}
            onChange={handleChange}
            className="custom-input"
          />
        </div>

        {/* Blood Type [cite: 32] */}
        <div className="input-label">Blood Type *</div>
        <select 
          name="bloodType" 
          value={formData.bloodType} 
          onChange={handleChange}
          className="custom-input select-input"
        >
          <option value="">Select Blood Type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
        </select>
      </div>

      {/* Footer [cite: 36] */}
      <div className="footer-section">
        <button className="btn-signin-large" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Step3;