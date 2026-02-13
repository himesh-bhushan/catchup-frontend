import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Step7 = ({ formData, handleChange, handleSubmit, prevStep }) => {
  return (
    <div className="signup-step-container">
      <div className="top-bar">
        <button className="back-btn" onClick={prevStep}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      <div className="header-section">
        <h1>Profile Setup</h1>
        <div className="tomato-animation">
             🍅 {/* Tomato "Super Hero" goes here */}
        </div>
      </div>

      <div className="form-section">
        {/* Primary Health Goal */}
        <div className="input-label">Primary Health Goal *</div>
        <select 
          name="primaryGoal" 
          value={formData.primaryGoal} 
          onChange={handleChange}
          className="custom-input select-input"
        >
          <option value="">Select your Primary Goal</option>
          <option value="lose_weight">Lose Weight</option>
          <option value="maintain">Maintain Health</option>
          <option value="muscle">Build Muscle</option>
        </select>

        {/* Activity Level */}
        <div className="input-label">Current Activity Level *</div>
        <select 
          name="activityLevel" 
          value={formData.activityLevel} 
          onChange={handleChange}
          className="custom-input select-input"
        >
          <option value="">Select your Activity Level</option>
          <option value="sedentary">Sedentary</option>
          <option value="active">Active</option>
          <option value="very_active">Very Active</option>
        </select>

        {/* Target Weight */}
        <input
          type="number"
          name="targetWeight"
          placeholder="Target Weight (kg)"
          value={formData.targetWeight}
          onChange={handleChange}
          className="custom-input"
        />
      </div>

      <div className="footer-section">
        <button className="btn-signin-large" onClick={handleSubmit}>
          Done!
        </button>
      </div>
    </div>
  );
};

export default Step7;
