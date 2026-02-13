import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../context/NotificationContext'; 

// ✅ Correct Import Path
import '../Profile.css'; 

const Notifications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showNotification } = useNotification(); 

  // Local state for toggles
  const [settings, setSettings] = useState({
    trends: true,
    alerts: true,
    goals: true
  });

  const handleToggle = (key, label) => {
    const newState = !settings[key];
    setSettings({ ...settings, [key]: newState });
    
    if (newState) {
        showNotification(`${label} Enabled`, 'success');
    } else {
        showNotification(`${label} Disabled`, 'info');
    }
  };

  const notificationItems = [
    {
      key: 'trends',
      label: 'Trends',
      description: 'Receive a notification when there’s a new trend in your health data.'
    },
    {
      key: 'alerts',
      label: 'Alerts',
      description: 'Receive instant alerts when your health data shows unusual readings.'
    },
    {
      key: 'goals',
      label: 'Health Goals',
      description: 'Stay motivated with reminders and progress updates towards your personal health goals.'
    }
  ];

  return (
    // ✅ Replaced 'notifications-page-wrapper' with standard 'content-card' layout for consistency
    // However, since you want it WIDER, we can use a custom style or override the max-width
    <div className="notifications-wrapper-wide">
      
      {/* ✅ Consistent Header Style (Matches MedicalID / Personal Details) */}
      <div className="content-header" style={{marginBottom: '30px'}}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             {/* Mobile Back Button */}
             <FiArrowLeft 
               className="mobile-back-btn"
               size={24} 
               style={{cursor:'pointer'}}
               onClick={() => navigate('/profile')} 
             />
             <h2 style={{fontSize: '24px', fontWeight: '700', margin: 0}}>{t('notifications')}</h2>
         </div>
      </div>

      <div className="notifications-list">
        {notificationItems.map((item) => (
          <div key={item.key} className="notification-block">
            
            {/* 1. The White Pill (Label + Toggle) */}
            <div className="notification-pill-wide">
                <span className="pill-label">{item.label}</span>
                
                <div 
                    className={`toggle-switch ${settings[item.key] ? 'on' : ''}`} 
                    onClick={() => handleToggle(item.key, item.label)}
                >
                    <div className="toggle-thumb"></div>
                </div>
            </div>

            {/* 2. Description (Outside and Below) */}
            <p className="notification-description">
                {item.description}
            </p>

          </div>
        ))}
      </div>

    </div>
  );
};

export default Notifications;