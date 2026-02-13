import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi'; 
import tomatoHero from '../../assets/raise-hand.png'; 
import '../../styles/Signup.css';

import { supabase } from '../../supabase';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 6; 

  const [loading, setLoading] = useState(false);
  const [, setUserID] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', dob: '', gender: '', phone: '',
    height: '', weight: '', bloodType: '',
    conditions: [], 
    medications: '', allergies: '',
    emergencyName: '', emergencyPhone: '',
    // ✅ NEW: Store the custom "Other" text separately
    otherConditionText: '' 
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCondition = (condition) => {
    setFormData(prev => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists 
          ? prev.conditions.filter(c => c !== condition)
          : [...prev.conditions, condition]
      };
    });
  };

  const handleAccountCreation = async () => {
    if (!agreed) {
        alert("Please agree to the Terms of Service and Privacy Policies.");
        return;
    }
    if (!formData.email || !formData.password) {
      alert("Please enter an email and password.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      if (data.user) {
        setUserID(data.user.id); 
        handleNext();
      }
    } catch (error) {
      console.error(error);
      alert("Error creating account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = () => {
    if (!formData.firstName || !formData.lastName || !formData.dob || !formData.gender || !formData.phone) {
      alert("Please fill in all fields, including Phone Number.");
      return;
    }
    handleNext();
  };

  const handleStep3Next = () => {
    if (!formData.height || !formData.weight || !formData.bloodType) {
      alert("Please fill in Height, Weight, and Blood Type.");
      return;
    }
    handleNext();
  };

  const handleFinalSubmit = async () => {
    if (!formData.emergencyName || !formData.emergencyPhone) {
      alert("Emergency Contact Name and Phone are required.");
      return;
    }

    setLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
        alert("Session expired. Please log in again.");
        setLoading(false);
        navigate('/signin');
        return;
    }

    const currentUid = sessionData.session.user.id;
    localStorage.setItem('userName', formData.firstName);

    // ✅ LOGIC: Merge "Others..." text into the main conditions array
    let finalConditions = [...formData.conditions];
    if (finalConditions.includes('Others...')) {
        // Remove the placeholder string
        finalConditions = finalConditions.filter(c => c !== 'Others...');
        // Add the user typed text if it exists
        if (formData.otherConditionText.trim()) {
            finalConditions.push(formData.otherConditionText.trim());
        }
    }

    try {
        const { error } = await supabase.from('profiles').upsert({
            id: currentUid,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            dob: formData.dob,
            gender: formData.gender,
            phone: formData.phone,
            height: formData.height,
            weight: formData.weight,
            blood_type: formData.bloodType,
            
            // ✅ Save the processed array
            conditions: finalConditions, 
            
            medications: formData.medications,
            allergies: formData.allergies,
            emergency_name: formData.emergencyName,
            emergency_phone: formData.emergencyPhone,
            calorie_goal: 500 
        });

        if (error) throw error;
        navigate('/dashboard'); 

    } catch (err) {
        console.error("Save Error:", err.message);
        alert("Account created, but failed to save profile details: " + err.message);
        navigate('/dashboard');
    } finally {
        setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={() => navigate('/signin')}>
                <FiArrowLeft size={28} />
             </button>
             <h2>Let’s Sign you up.</h2>
          </div>
          
          <p className="step-subtitle">Welcome to join us!</p>
          <input type="email" name="email" placeholder="Email Address" className="custom-input" value={formData.email} onChange={handleChange} />
          
          <div style={{position: 'relative'}}>
            <input 
              type={showPassword ? "text" : "password"} name="password" placeholder="Password" 
              className="custom-input" value={formData.password} onChange={handleChange} 
            />
            <span onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#666'}}>
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </span>
          </div>

          <div style={{position: 'relative'}}>
            <input 
              type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" 
              className="custom-input" value={formData.confirmPassword} onChange={handleChange} 
            />
            <span onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#666'}}>
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </span>
          </div>
          
          <div className="terms-checkbox-wrapper">
            <input 
                type="checkbox" 
                id="termsCheck" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
                className="checkbox-input"
            />
            <label htmlFor="termsCheck" className="terms-label">
                By continuing, you agree to CatchUp’s <strong>Terms of Service</strong> and <strong>Privacy Policies</strong>.
            </label>
          </div>

          <button 
            className="btn-next" 
            onClick={handleAccountCreation} 
            disabled={loading || !agreed}
            style={{ opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }}
          >
            {loading ? "Processing..." : "Sign up"}
          </button>
        </div>
      );

      case 2: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={handleBack}>
                <FiArrowLeft size={28} />
             </button>
             <h2 className="section-title">Profile Setup</h2>
          </div>

          <label className="input-label">First Name <span className="req">*</span></label>
          <input type="text" name="firstName" className="custom-input" value={formData.firstName} onChange={handleChange} />
          <label className="input-label">Last Name <span className="req">*</span></label>
          <input type="text" name="lastName" className="custom-input" value={formData.lastName} onChange={handleChange} />
          <label className="input-label">Date of Birth <span className="req">*</span></label>
          <input type="date" name="dob" className="custom-input" value={formData.dob} onChange={handleChange} />
          <label className="input-label">Gender <span className="req">*</span></label>
          <select name="gender" className="custom-input" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <label className="input-label">Phone Number <span className="req">*</span></label>
          <input type="tel" name="phone" className="custom-input" value={formData.phone} onChange={handleChange} />
          <button className="btn-next" onClick={handleStep2Next}>Next</button>
        </div>
      );

      case 3: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={handleBack}><FiArrowLeft size={28} /></button>
             <h2 className="section-title">Profile Setup</h2>
          </div>

          <label className="input-label">Height (cm) <span className="req">*</span></label>
          <input type="number" name="height" className="custom-input" value={formData.height} onChange={handleChange} />
          <label className="input-label">Weight (kg) <span className="req">*</span></label>
          <input type="number" name="weight" className="custom-input" value={formData.weight} onChange={handleChange} />
          <label className="input-label">Blood Type <span className="req">*</span></label>
          <select name="bloodType" className="custom-input" value={formData.bloodType} onChange={handleChange}>
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
          <button className="btn-next" onClick={handleStep3Next}>Next</button>
        </div>
      );

      case 4: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={handleBack}><FiArrowLeft size={28} /></button>
             <h2 className="section-title">Profile Setup</h2>
          </div>

          <h3 className="subsection-title">Pre-existing Condition</h3>
          <div className="checkbox-grid">
            {['Asthma', 'Diabetes', 'Hypertension', 'Arthritis', 'High Cholesterol', 'Thyroid Disorder', 'Heart Disease', 'Others...'].map(cond => (
              <div 
                key={cond} 
                className={`checkbox-item ${formData.conditions.includes(cond) ? 'checked' : ''}`}
                onClick={() => toggleCondition(cond)}
              >
                <div className="circle-check"></div>
                <span>{cond}</span>
              </div>
            ))}
          </div>

          {/* ✅ NEW: Text Input appears if "Others..." is checked */}
          {formData.conditions.includes('Others...') && (
            <div className="animate-fade-in" style={{marginBottom: '20px'}}>
                <label className="input-label" style={{marginTop: 0}}>Please specify condition:</label>
                <input 
                    type="text" 
                    name="otherConditionText" 
                    className="custom-input" 
                    placeholder="Type condition here..." 
                    value={formData.otherConditionText} 
                    onChange={handleChange}
                    autoFocus
                />
            </div>
          )}

          <button className="btn-next" onClick={handleNext}>Next 1/3</button>
        </div>
      );

      case 5: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={handleBack}><FiArrowLeft size={28} /></button>
             <h2 className="section-title">Profile Setup</h2>
          </div>

          <h3 className="subsection-title">Current Medication</h3>
          <textarea name="medications" className="custom-input text-area" placeholder="List any medications..." value={formData.medications} onChange={handleChange}></textarea>
          <h3 className="subsection-title">Allergies</h3>
          <textarea name="allergies" className="custom-input text-area" placeholder="List any allergies..." value={formData.allergies} onChange={handleChange}></textarea>
          <button className="btn-next" onClick={handleNext}>Next 2/3</button>
        </div>
      );

      case 6: return (
        <div className="step-container animate-fade-in">
          <div className="step-header-row">
             <button className="back-btn-inline" onClick={handleBack}><FiArrowLeft size={28} /></button>
             <h2 className="section-title">Profile Setup</h2>
          </div>

          <label className="input-label">Emergency Contact Name <span className="req">*</span></label>
          <input type="text" name="emergencyName" className="custom-input" value={formData.emergencyName} onChange={handleChange} />
          
          <label className="input-label">Emergency Contact Phone <span className="req">*</span></label>
          <input type="tel" name="emergencyPhone" className="custom-input" value={formData.emergencyPhone} onChange={handleChange} />
          
          <div className="info-box">
            <FiInfo className="info-icon" size={20} />
            <p>This information is encrypted and only accessible to you and authorized healthcare providers in case of emergency.</p>
          </div>
          <button className="btn-next finish-btn" onClick={handleFinalSubmit} disabled={loading}>
            {loading ? "Processing..." : "Next 3/3 (Finish)"}
          </button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-hero-side">
        <div className="hero-content-wrapper">
          <h1>Time to<br />“ketchup” on<br />your wellness</h1>
          <img src={tomatoHero} alt="Tomato Superhero" className="hero-image" />
        </div>
      </div>
      <div className="signup-form-side">
        <div className="signup-container">
          <div className="signup-header">
            <div className="progress-bar-container">
               <div className="signup-progress-fill" style={{width: `${(step / totalSteps) * 100}%`}}></div>
            </div>
          </div>
          <div className="signup-content">{renderStep()}</div>
        </div>
      </div>
    </div>
  );
};

export default Signup;