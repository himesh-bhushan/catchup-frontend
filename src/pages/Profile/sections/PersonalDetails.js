import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiAlertTriangle } from 'react-icons/fi'; // ✅ Added icons
import { supabase } from '../../../supabase'; 

const PersonalDetails = () => {
  const navigate = useNavigate();
  
  // 1. INSTANT LOAD (Fallback to Local Storage)
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('personalDetails_cache');
      return cached ? JSON.parse(cached) : { firstName: localStorage.getItem('userName') || '' };
    } catch (e) { return {}; }
  };

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '',
    ...loadCachedData() // Merge cache
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 2. FETCH FROM SUPABASE ---
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          // ✅ Fetch directly from 'profiles' table
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          
          if (data) {
            // Map Database (snake_case) -> App (camelCase)
            const mappedData = {
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                dob: data.dob || '',
                gender: data.gender || '',
                phone: data.phone || ''
            };

            setFormData(prev => ({ ...prev, ...mappedData }));
            
            // Update Cache
            localStorage.setItem('personalDetails_cache', JSON.stringify(mappedData));
            if (mappedData.firstName) {
               localStorage.setItem('userName', mappedData.firstName);
            }
          }
        } catch (error) {
          console.error("❌ Fetch Error:", error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsEditing(false); // Close edit UI immediately

    // Update Cache immediately for UI snappiness
    localStorage.setItem('personalDetails_cache', JSON.stringify(formData));
    localStorage.setItem('userName', formData.firstName);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // ✅ Send Update to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            dob: formData.dob,
            gender: formData.gender,
            phone: formData.phone
        })
        .eq('id', session.user.id);

      if (error) throw error;
      console.log("✅ Saved to Supabase!");

    } catch (error) {
      console.error("❌ Save Failed:", error.message);
      alert("Error saving profile.");
      setIsEditing(true); // Re-open edit mode on error
    }
  };

  // --- ⚠️ DELETE ACCOUNT FUNCTION ---
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete your account?\n\nThis will permanently remove your personal details and medical data. This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // 1. Delete the user's data row (Wipes Name, Medical ID, etc.)
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', session.user.id);

            if (error) throw error;

            // 2. Sign Out
            await supabase.auth.signOut();
            localStorage.clear();
            
            // 3. Redirect to Signup (Fresh Start)
            alert("Your account data has been deleted.");
            navigate('/signup');
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete account. Please try again.");
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading details...</div>;

  return (
    <div className="content-card">
      <div className="content-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <FiArrowLeft 
              className="mobile-back-btn" 
              size={24}
              style={{cursor: 'pointer'}} 
              onClick={() => navigate('/profile')} 
            />
            <h2>Personal Details</h2>
        </div>
        
        {/* EDIT / SAVE BUTTON */}
        {isEditing ? (
          <button 
            onClick={handleSave}
            style={{border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#007bff'}}
          >
            Save
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            style={{border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer'}}
          >
            Edit
          </button>
        )}
      </div>

      <div className="details-form">
        
        {/* FIRST NAME */}
        <label className="profile-label">First Name</label>
        {isEditing ? (
          <input className="profile-value input-mode" name="firstName" value={formData.firstName} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px'}} />
        ) : (
          <div className="profile-value">{formData.firstName || "—"}</div>
        )}

        {/* LAST NAME */}
        <label className="profile-label">Last Name</label>
        {isEditing ? (
          <input className="profile-value input-mode" name="lastName" value={formData.lastName} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px'}} />
        ) : (
          <div className="profile-value">{formData.lastName || "—"}</div>
        )}

        {/* DATE OF BIRTH */}
        <label className="profile-label">Date of Birth</label>
        {isEditing ? (
          <input type="date" className="profile-value input-mode" name="dob" value={formData.dob} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px'}} />
        ) : (
          <div className="profile-value">{formData.dob || "—"}</div>
        )}

        {/* GENDER */}
        <label className="profile-label">Gender</label>
        {isEditing ? (
          <select className="profile-value input-mode" name="gender" value={formData.gender} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px'}}>
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <div className="profile-value">{formData.gender || "—"}</div>
        )}

        {/* PHONE */}
        <label className="profile-label">Phone Number</label>
        {isEditing ? (
          <input type="tel" className="profile-value input-mode" name="phone" value={formData.phone} onChange={handleChange} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', borderBottom: 'none'}} />
        ) : (
          <div className="profile-value" style={{borderBottom: 'none'}}>{formData.phone || "—"}</div>
        )}

      </div>

      {/* --- ⚠️ DANGER ZONE SECTION --- */}
      <div style={{marginTop: '10px', paddingTop: '5px', borderTop: '1px solid #eee'}}>        
        <button 
            onClick={handleDeleteAccount}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 20px',
                backgroundColor: '#FFF5F5', // Light Red Background
                color: '#C62828',           // Dark Red Text
                border: '1px solid #FFCDD2',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                width: '100%',
                justifyContent: 'center',
                transition: '0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFEBEE'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFF5F5'}
        >
            <FiTrash2 /> Delete My Account
        </button>
        
        <div style={{display: 'flex', gap: '8px', marginTop: '10px', fontSize: '0.8rem', color: '#666', justifyContent: 'center'}}>
            <FiAlertTriangle color="#FFA000" />
            <span>This action will permanently delete your data.</span>
        </div>
      </div>

    </div>
  );
};

export default PersonalDetails;