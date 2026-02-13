import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiChevronRight, FiUser, FiArrowLeft, FiLogOut, FiEdit2, FiX } from 'react-icons/fi'; 
import { supabase } from '../../supabase'; 
import { useTranslation } from 'react-i18next';

// ✅ FIX: Point to the components folder (Go up 2 levels)
import AvatarSelector from '../../components/AvatarSelector'; 

const ProfileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 1. STATE
  const [firstName, setFirstName] = useState(localStorage.getItem('userName') || "Friend");
  const [email, setEmail] = useState(""); 
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // Avatar Modal State
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // 2. FETCH LOGIC
  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setEmail(session.user.email);

        try {
          const { data } = await supabase
            .from('profiles')
            .select('first_name, avatar_url') 
            .eq('id', session.user.id)
            .single();

          if (data) {
             if (data.first_name) {
                 setFirstName(data.first_name);
                 localStorage.setItem('userName', data.first_name);
             }
             if (data.avatar_url) {
                 // Check if it's a full URL or a path
                 if (data.avatar_url.startsWith('http')) {
                     setAvatarUrl(data.avatar_url);
                 } else {
                     const { data: img } = await supabase.storage.from('avatars').download(data.avatar_url);
                     if (img) setAvatarUrl(URL.createObjectURL(img));
                 }
             }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfileData();
  }, []);

  // ✅ 3. HANDLER: Update Database when AvatarSelector returns a new URL
  const handleAvatarUpdate = async (newUrl) => {
    try {
        setAvatarUrl(newUrl); // Update UI immediately

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Save the new public URL to the profiles table
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: newUrl })
            .eq('id', session.user.id);

        if (error) throw error;
        
        // Close modal on success
        setShowAvatarMenu(false); 

    } catch (error) {
        console.error("Error updating profile avatar:", error.message);
        alert("Failed to save avatar choice.");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear(); 
      navigate('/signin'); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const menuItems = [
    { label: t('personal_details'), path: '/profile/details' },
    { label: t('medical_id'), path: '/profile/medical' },
    { label: t('display_title'), path: '/profile/display', section: t('features') }, 
    { label: t('notifications'), path: '/profile/notifications', section: t('features') },
    { label: t('connected_apps'), path: '/profile/apps', section: t('integrations') },
  ];

  return (
    <div className="profile-menu-side">
      
      {/* --- HEADER --- */}
      <div className="profile-header">
        <button className="nav-back-btn" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft size={24} color="var(--text-primary)" />
        </button>
        
        {/* AVATAR WRAPPER */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <div 
                className="avatar-circle" 
                onClick={() => setShowAvatarMenu(true)} 
                style={{ cursor: 'pointer', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            >
                {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                ) : (
                    <FiUser />
                )}
            </div>
            
            {/* Edit Icon Badge */}
            <div 
                onClick={() => setShowAvatarMenu(true)}
                style={{
                    position: 'absolute', bottom: '0', right: '0',
                    backgroundColor: 'var(--text-primary)', color: 'white',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                <FiEdit2 size={14} />
            </div>
        </div>
        
        <div style={{textAlign: 'center', marginTop: '10px'}}>
            <h1 className="profile-name" style={{marginBottom: '5px', color: 'var(--text-primary)'}}>{firstName}</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all', padding: '0 10px' }}>
                {email}
            </p>
        </div>
      </div>

      {/* ✅ AVATAR SELECTION MODAL */}
      {showAvatarMenu && (
        <div style={{
            padding: '20px', margin: '0 20px 20px 20px', backgroundColor: '#f9f9f9', 
            borderRadius: '16px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)', position: 'relative'
        }}>
            <button 
                onClick={() => setShowAvatarMenu(false)} 
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <FiX size={20} color="#666" />
            </button>

            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#333', textAlign:'center' }}>Change Profile Photo</h4>

            {/* ✅ The Avatar Selector Component handles upload & defaults */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AvatarSelector 
                    currentAvatarUrl={avatarUrl}
                    onAvatarChange={handleAvatarUpdate} 
                />
            </div>
        </div>
      )}

      {/* --- MENU SECTIONS --- */}
      <div className="menu-list">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.path}>
            {(index === 0 || item.section !== menuItems[index-1].section) && (
               <div className="menu-section-label">{item.section || " "}</div>
            )}
            
            <div 
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.label}</span>
              <FiChevronRight color="#ccc" />
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0 20px' }}>
        <button 
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '14px', backgroundColor: '#FF3B30', color: '#fff',              
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 6px rgba(255, 59, 48, 0.2)'
          }}
        >
          <FiLogOut size={20} /> {t('sign_out')}
        </button>
      </div>
      
      <p className="privacy-text" style={{ marginTop: '20px' }}>{t('privacy_note')}</p>
    </div>
  );
};

export default ProfileMenu;