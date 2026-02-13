import React, { useState, useEffect } from 'react';
import { FiUser, FiDownload } from 'react-icons/fi'; 
import DashboardNav from '../../components/DashboardNav';
import './Report.css';
import QRCode from "react-qr-code"; 
import tomatoHero from '../../assets/raise-hand.png'; 
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabase';

const Report = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(localStorage.getItem('userName') || "Friend");
  const [userID, setUserID] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // ✅ HELPER: Download Image
  const downloadImage = async (path) => {
    if (!path) return;
    if (path.startsWith('http')) {
        setAvatarUrl(path);
        return;
    }
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      setAvatarUrl(URL.createObjectURL(data));
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserID(session.user.id); 
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (data && !error) {
             const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
             if (name) {
                 setFullName(name);
                 if (data.first_name) localStorage.setItem('userName', data.first_name);
             }
             if (data.avatar_url) {
                 downloadImage(data.avatar_url);
             }
          }
        } catch (error) {
          console.error("Error fetching name:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // ✅ UPDATED: URL Configuration for Production
  // This uses your Vercel environment variable to point to Render instead of your local machine.
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5050"; 
  const qrValue = userID ? `${backendUrl}/api/report/pdf/${userID}` : "";

  return (
    <div className="report-page-container">
      <DashboardNav />

      <div className="share-health-wrapper">
        
        {/* LEFT SECTION */}
        <div className="share-left-section">
          <div className="instructions-container">
             <div className="sticky-note">
                <h2>{t('qr_title') || "My Biomarker Data?"}<br/>{t('scan_here') || "Scan Here!"}</h2>
                <div className="steps-list">
                   <p>1. {t('step_1') || "Open your camera app."}</p>
                   <p>2. {t('step_2') || "Scan the code to instantly download the PDF Report."}</p>
                </div>
             </div>
             <div className="character-illustration">
                <img alt="Tomato" src={tomatoHero} className="tomato-img" />
             </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="share-right-section">

           {/* Profile Pill */}
           <div className="profile-pill-large">
              <div className="profile-icon-circle-large" style={{ overflow: 'hidden', padding: 0 }}>
                 {avatarUrl ? (
                    <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                 ) : (
                    <FiUser size={30} color="var(--text-primary)" style={{ padding: '10px' }} />
                 )}
              </div>
              <div className="profile-text-large">
                 <h3>{fullName}</h3>
                 <span>{t('share_provider') || "share this to healthcare provider"}</span>
              </div>
           </div>

           {/* QR CARD */}
           <div className="qr-card-large" style={{ 
               display: 'flex', 
               flexDirection: 'column', 
               alignItems: 'center', 
               justifyContent: 'center', 
               padding: '25px', 
               background: 'var(--card-bg)', 
               border: '1px solid var(--border-color)'
           }}>
              {qrValue ? (
                  <div style={{ background: 'white', padding: '10px', borderRadius: '10px' }}>
                    <QRCode 
                        value={qrValue} 
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                    />
                  </div>
              ) : (
                  <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>Loading QR...</p>
              )}
           </div>

           {/* DOWNLOAD BUTTON */}
           <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {/* If the QR code and button link still show a double slash (//), 
                   ensure REACT_APP_BACKEND_URL in Vercel settings doesn't end with a "/"
                */}
                <a href={qrValue} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px',
                        backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)',      
                        border: '1px solid var(--border-color)', borderRadius: '30px',
                        fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <FiDownload size={20} />
                        {t('download_pdf') || "Download PDF"}
                    </button>
                </a>
           </div>

        </div>

      </div>
    </div>
  );
};

export default Report;