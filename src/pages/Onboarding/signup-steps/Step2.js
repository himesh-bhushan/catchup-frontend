import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Step2 = ({ formData, handleChange, nextStep, prevStep }) => {
  return (
    <div className="signup-step-container">
      {/* Top Bar with Back Arrow */}
      <div className="top-bar">
        <button className="back-btn" onClick={prevStep}>
          <FiArrowLeft size={24} color="#000" />
        </button>
      </div>

      {/* Header  */}
      <div className="header-section">
        <h1>Profile Setup</h1>
        {/* Progress indicator can go here if needed */}
      </div>

      <div className="form-section">
        {/* First Name [cite: 18] */}
        <input
          type="text"
          name="firstName"
          placeholder="First Name *"
          value={formData.firstName}
          onChange={handleChange}
          className="custom-input"
        />

        {/* Last Name [cite: 19] */}
        <input
          type="text"
          name="lastName"
          placeholder="Last Name *"
          value={formData.lastName}
          onChange={handleChange}
          className="custom-input"
        />

        {/* Date of Birth [cite: 20] */}
        <div className="input-label">Date of Birth *</div>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          className="custom-input"
        />

        {/* Gender [cite: 22] */}
        <div className="input-label">Gender *</div>
        <select 
          name="gender" 
          value={formData.gender} 
          onChange={handleChange}
          className="custom-input select-input"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* Phone Number [cite: 24] */}
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="custom-input"
        />
      </div>

      {/* Footer [cite: 25] */}
      <div className="footer-section">
        <button className="btn-signin-large" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Step2;