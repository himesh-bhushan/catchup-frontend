import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiPhone, FiAlertCircle } from 'react-icons/fi'; 
import { supabase } from '../../../supabase'; 
import { useMedicalNotification } from '../../../context/MedicalNotificationContext';

const MedicalID = () => {
  const navigate = useNavigate();
  
  const { 
    updateMedicalData, 
    isLockedVisible, 
    setIsLockedVisible,
    triggerSystemNotification 
  } = useMedicalNotification();

  // --- CACHE ---
  const getCachedData = () => {
    try { return JSON.parse(localStorage.getItem('medicalID_cache') || '{}'); } 
    catch (e) { return {}; }
  };
  const cache = getCachedData();

  const [isEditing, setIsEditing] = useState(false);
  const [userID, setUserID] = useState(null);

  const [headerInfo, setHeaderInfo] = useState({
    name: cache.name || localStorage.getItem('userName') || '', 
    gender: cache.gender || '',
    age: cache.age || ''
  });

  const [formData, setFormData] = useState({
    bloodType: cache.bloodType || '',
    conditions: cache.conditions || '',
    allergies: cache.allergies || '',
    emergencyName: cache.emergencyName || '',
    emergencyPhone: cache.emergencyPhone || ''
  });

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // --- SYNC WITH CONTEXT ---
  useEffect(() => {
    const sosString = formData.emergencyName && formData.emergencyPhone 
        ? `${formData.emergencyName} (${formData.emergencyPhone})`
        : formData.emergencyPhone || formData.emergencyName || 'Not Set';

    updateMedicalData({
        name: headerInfo.name,
        age: headerInfo.age,
        bloodGroup: formData.bloodType || '—',
        allergies: formData.allergies || 'None',
        conditions: formData.conditions || 'None',
        emergencyContact: sosString
    });
  }, [headerInfo, formData, updateMedicalData]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchMedicalData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserID(session.user.id);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, dob, gender, blood_type, conditions, allergies, emergency_name, emergency_phone') 
            .eq('id', session.user.id)
            .single();

          if (data && !error) {
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            const ageVal = calculateAge(data.dob);
            const ageStr = ageVal ? `${ageVal} years old` : '';
            const condString = Array.isArray(data.conditions) ? data.conditions.join(', ') : (data.conditions || '');

            const newHeader = { name: fullName, gender: data.gender || '', age: ageStr };
            const newForm = { 
                bloodType: data.blood_type || '', 
                conditions: condString, 
                allergies: data.allergies || '',
                emergencyName: data.emergency_name || '',
                emergencyPhone: data.emergency_phone || ''
            };

            setHeaderInfo(newHeader);
            setFormData(newForm);
            localStorage.setItem('medicalID_cache', JSON.stringify({ ...newHeader, ...newForm }));
          }
        } catch (error) { console.error("Error fetching medical ID:", error); }
      }
    };
    fetchMedicalData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userID) return;
    setIsEditing(false); 

    const cacheUpdate = { ...headerInfo, ...formData };
    localStorage.setItem('medicalID_cache', JSON.stringify(cacheUpdate));

    try {
      const conditionsArray = formData.conditions.split(',').map(item => item.trim()).filter(i => i);
      
      const { error } = await supabase
        .from('profiles')
        .update({
            blood_type: formData.bloodType,
            conditions: conditionsArray,
            allergies: formData.allergies,
            emergency_name: formData.emergencyName,
            emergency_phone: formData.emergencyPhone
        })
        .eq('id', userID);

      if (error) throw error;
      if (isLockedVisible) triggerSystemNotification(); 
      
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to save changes.");
    }
  };

  const handleToggle = () => {
    const newState = !isLockedVisible;
    setIsLockedVisible(newState);
    if (newState) triggerSystemNotification();
  };

  return (
    <div className="content-card">
      <div className="content-header">
         <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <FiArrowLeft className="mobile-back-btn" size={24} style={{cursor: 'pointer'}} onClick={() => navigate('/profile')} />
            <h2>Medical ID</h2>
        </div>
        {isEditing ? (
          <button onClick={handleSave} style={{border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#007bff'}}>Save</button>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Edit</button>
        )}
      </div>

      <div className="toggle-row">
        <div>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Show When Locked</span>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Display Medical ID on lock screen notification.</p>
        </div>
        <div className={`toggle-switch ${isLockedVisible ? 'on' : ''}`} onClick={handleToggle}>
          <div className="toggle-thumb"></div>
        </div>
      </div>

      <div style={{border: '1px solid var(--border-color)', borderRadius: '15px', padding: '20px', marginTop: '10px'}}>
        
        {/* User Summary */}
        <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)'}}>
           <div style={{width: '50px', height: '50px', background: 'var(--bg-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
             <FiUser color="var(--text-secondary)" size={24} />
           </div>
           <div>
             <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{headerInfo.name || "—"}</div>
             <div style={{fontSize: '13px', color: 'var(--text-secondary)'}}>
                {headerInfo.gender} {headerInfo.gender && headerInfo.age ? ' • ' : ''} {headerInfo.age}
             </div>
           </div>
        </div>

        {/* --- 1. MEDICAL DETAILS (Moved to Top) --- */}
        <label className="profile-label">Blood Type</label>
        {isEditing ? (
          <select className="profile-value input-mode" name="bloodType" value={formData.bloodType} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', color: '#FF3B30'}}>
            <option value="">Select...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        ) : (
          <div className="profile-value" style={{color: '#000000'}}>{formData.bloodType || "—"}</div>
        )}

        <label className="profile-label">Pre-existing Condition</label>
        {isEditing ? (
          <textarea className="profile-value input-mode" name="conditions" value={formData.conditions} onChange={handleChange} placeholder="Separate with commas..." style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', color: '#000000'}} />
        ) : (
          <div className="profile-value" style={{color: '#000000'}}>{formData.conditions || "None"}</div>
        )}

        <label className="profile-label">Allergies</label>
        {isEditing ? (
           <textarea className="profile-value input-mode" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="List allergies..." style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', color: '#000000', marginBottom: '20px'}} />
        ) : (
           <div className="profile-value" style={{color: '#000000', marginBottom: '20px'}}>{formData.allergies || "None"}</div>
        )}

        {/* --- 2. EMERGENCY CONTACT (Moved to Bottom) --- */}
        <div style={{marginTop: '5px', paddingTop: '5px', borderTop: '1px solid var(--border-color)'}}>
            <h4 style={{fontSize: '14px', color: '#FF3B30', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px'}}>
                <FiAlertCircle /> EMERGENCY CONTACT
            </h4>

            {/* Name Field */}
            <div style={{marginBottom: '12px'}}>
                <label className="profile-label" style={{fontSize: '12px', marginBottom: '4px', display:'block', color: '#FF3B30'}}>Contact Name</label>
                {isEditing ? (
                    <input 
                        className="profile-value input-mode" 
                        name="emergencyName" 
                        value={formData.emergencyName} 
                        onChange={handleChange}
                        placeholder="e.g. Mom"
                        style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px'}}
                    />
                ) : (
                    <div style={{fontWeight: '600', fontSize: '16px', color: '#000000'}}>{formData.emergencyName || "—"}</div>
                )}
            </div>

            {/* Phone Field */}
            <div>
                <label className="profile-label" style={{fontSize: '12px', marginBottom: '4px', display:'block', color: '#FF3B30'}}>Phone Number</label>
                {isEditing ? (
                    <input 
                        type="tel"
                        className="profile-value input-mode" 
                        name="emergencyPhone" 
                        value={formData.emergencyPhone} 
                        onChange={handleChange}
                        placeholder="+1 234..."
                        style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px'}}
                    />
                ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '16px', color: '#000000'}}>
                        <FiPhone size={14}/> {formData.emergencyPhone || "—"}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default MedicalID;