import React, { useState, useEffect } from 'react';
import { FiActivity, FiArrowLeft, FiHeart, FiX } from 'react-icons/fi';
import { supabase } from '../../../supabase';
import axios from 'axios';

const ConnectedApps = () => {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState(localStorage.getItem('userName') || "Friend");
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // 1. Fetch user data on load to check connection status
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, google_connected')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.first_name) setFirstName(profile.first_name);
          setIsDeviceConnected(profile.google_connected || localStorage.getItem('deviceConnected') === 'true');
        }
      }
    };
    fetchUserData();
  }, []);

  // 2. Handle Sending the Email Guide
  const handleSendSetupEmail = async () => {
    if (!user || !user.email) {
      alert("User session not found. Please log in again.");
      return;
    }
    
    setEmailSending(true);
    try {
        // Call Express backend to send the email
        await axios.post('https://backend.catchup.page/api/send-tracker-email', {
            email: user.email,
            userId: user.id,
            firstName: firstName
        });

        // Update Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ google_connected: true }) 
            .eq('id', user.id);

        if (error) throw error;

        // Update UI
        setIsDeviceConnected(true);
        localStorage.setItem('deviceConnected', 'true');
        alert("Setup guide sent! Please check your email to install the shortcut.");

    } catch (err) {
        console.error("Failed to send setup email", err);
        alert("Oops! We couldn't send the email. Please try again.");
    } finally {
        setEmailSending(false);
    }
  };

  // 3. Handle Disconnecting
  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect Apple Health? Data sync will stop.")) {
        if (!user) return;
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ google_connected: false }) 
                .eq('id', user.id);

            if (error) throw error;
            
            setIsDeviceConnected(false);
            setShowConnectMenu(false);
            localStorage.setItem('deviceConnected', 'false');
            alert("Device disconnected successfully.");
        } catch (err) {
            console.error("Failed to disconnect", err);
            alert("Error disconnecting device.");
        }
    }
  };

  // Main Card Style matching the Profile section container
  const cardContainerStyle = { 
      background: 'white', 
      borderRadius: '20px', 
      padding: '0', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
  };

  return (
    <div style={cardContainerStyle}>
      
      {/* 🌟 SCENARIO 1: DEVICE IS ALREADY CONNECTED */}
      {isDeviceConnected ? (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ background: '#E8F5E9', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                <FiActivity size={50} color="#4CAF50" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111', margin: '0 0 10px 0' }}>Apple Health Synced</h2>
            <p style={{ color: '#666', marginBottom: '30px', maxWidth: '300px', lineHeight: '1.5' }}>
                Your daily activity, steps, and vitals are automatically syncing with CatchUp.
            </p>
            <button 
                onClick={handleDisconnect}
                style={{
                    background: '#FFF0F0', color: '#D32F2F', border: '1px solid #FFCDD2',
                    padding: '12px 30px', borderRadius: '30px', fontSize: '1rem', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                Disconnect Device
            </button>
        </div>

      /* 🌟 SCENARIO 2: SHOW EMAIL SETUP MENU (Matches Dashboard) */
      ) : showConnectMenu ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '50px 20px', height: '100%', justifyContent: 'center' }}>
            
            {/* Back Button */}
            <button onClick={() => setShowConnectMenu(false)} style={{ position: 'absolute', top: '25px', left: '25px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', transition: '0.2s' }}>
                <FiArrowLeft size={20} />
            </button>

            <div style={{ background: '#FFF0F0', padding: '18px', borderRadius: '50%', marginBottom: '20px' }}>
                <FiHeart size={45} color="#FF2D55" fill="#FF2D55" />
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#111', margin: '0 0 15px 0', letterSpacing: '-0.5px' }}>Sync Apple Health</h2>
            <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6', maxWidth: '340px', margin: '0 0 35px 0' }}>
                Download our secure shortcut to automatically sync your daily activity and close your rings.
            </p>

            <button 
                onClick={handleSendSetupEmail} 
                disabled={emailSending}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    background: emailSending ? '#666' : '#111', color: '#FFF', border: 'none',
                    padding: '18px 30px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: '800',
                    cursor: emailSending ? 'not-allowed' : 'pointer', width: '100%', maxWidth: '320px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => { if(!emailSending) e.currentTarget.style.transform = 'scale(1.03)' }}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {emailSending ? "Sending Email..." : "Email me the Setup Guide"}
            </button>
        </div>

      /* 🌟 SCENARIO 3: INITIAL CONNECT SCREEN (Matches Dashboard) */
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '50px 20px', height: '100%', justifyContent: 'center' }}>
            <FiActivity size={70} color="#E64A45" style={{ marginBottom: '20px' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 12px 0', color: '#111', letterSpacing: '-0.5px' }}>
                Connect Tracker
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '35px', maxWidth: '320px', lineHeight: '1.6' }}>
                Link your device to start tracking your health score and daily goals.
            </p>
            <button 
                onClick={() => setShowConnectMenu(true)}
                style={{
                    background: '#E64A45', color: '#FFF', border: 'none',
                    padding: '16px 45px', borderRadius: '30px', fontSize: '1.15rem', fontWeight: '800',
                    cursor: 'pointer', boxShadow: '0 8px 20px rgba(230, 74, 69, 0.3)',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Connect Device
            </button>
        </div>
      )}

    </div>
  );
};

export default ConnectedApps;