import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const conditionsList = [
  "Asthma", "Diabetes", "Arthritis", "Hypertension", 
  "Heart Disease", "Thyroid Disorder", "High Cholesterol", "Others..."
];

const Step4 = ({ formData, handleCheckboxChange, nextStep, prevStep }) => {
  return (
    <div className="signup-step-container">
      <div className="top-bar">
        <button className="back-btn" onClick={prevStep}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      <div className="header-section">
        <h1>Profile Setup</h1>
        <p className="step-indicator">Pre-existing Condition</p>
      </div>

      <div className="form-section">
        <div className="checkbox-list">
          {conditionsList.map((condition) => (
            <label key={condition} className="custom-checkbox-label">
              <input
                type="checkbox"
                checked={formData.conditions.includes(condition)}
                onChange={() => handleCheckboxChange(condition)}
                className="checkbox-input"
              />
              <span className="checkbox-text">{condition}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="footer-section">
        <div className="step-count">1/3</div> {/* Pagination from PDF */}
        <button className="btn-signin-large" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Step4;