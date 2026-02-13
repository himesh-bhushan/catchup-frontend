import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// SOLID BOLD ICONS
import { FaHeart, FaUserFriends, FaComment } from 'react-icons/fa'; 
import { BiScan } from 'react-icons/bi';
import { FiUser } from 'react-icons/fi';
import './DashboardNav.css';
import { useTranslation } from 'react-i18next';

// ✅ SUPABASE IMPORT
import { supabase } from '../supabase';

const DashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // ✅ STATE FOR AVATAR
  const [avatarUrl, setAvatarUrl] = useState(null);

  // ✅ FETCH AVATAR LOGIC
  useEffect(() => {
    const fetchAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();

        if (data?.avatar_url) {
          // Check if it's a full URL (default) or a storage path (uploaded)
          if (data.avatar_url.startsWith('http')) {
            setAvatarUrl(data.avatar_url);
          } else {
            // ✅ Standardized to singular 'avatar' bucket to match your setup
            const { data: img, error } = await supabase.storage.from('avatar').download(data.avatar_url);
            if (!error && img) setAvatarUrl(URL.createObjectURL(img));
          }
        }
      } catch (error) {
        console.error("Nav avatar fetch error:", error);
      }
    };

    fetchAvatar();
  }, []);

  const navItems = [
    { id: 'summary', label: t('nav_summary'), icon: <FaHeart />, path: '/dashboard' },
    { id: 'sharing', label: t('nav_sharing'), icon: <FaUserFriends />, path: '/sharing' },
    { id: 'report', label: t('nav_report'), icon: <BiScan />, path: '/report' },
    // ✅ PATH UPDATED TO /chatbot TO MATCH YOUR RECENT CONSOLE ERRORS
    { id: 'chat', label: t('nav_chat'), icon: <FaComment />, path: '/chatbot' }, 
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="desktop-sidebar">
        
        {/* 1. AVATAR (Top circle) */}
        <div className="sidebar-avatar" onClick={() => navigate('/profile')}>
           {avatarUrl ? (
             <img 
                src={avatarUrl} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
             />
           ) : (
             <FiUser size={24} /> 
           )}
        </div>
        
        {/* 2. MENU PILL */}
        <div className="sidebar-pill">
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* --- MOBILE BOTTOM BAR --- */}
      <div className="mobile-bottom-bar">
        {navItems.map(item => (
          <div 
            key={item.id} 
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="bottom-nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default DashboardNav;