import React, { useState, useEffect } from 'react';
import { FiActivity, FiCheckCircle, FiPlus, FiTrash2, FiWatch, FiMail, FiCheck } from 'react-icons/fi';
import { supabase } from '../../../supabase';

const ConnectedApps = () => {
  const [loading, setLoading] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState([]);
  
  // States for the Email Setup Guide
  const [isSendingGuide, setIsSendingGuide] = useState(false);
  const [guideSent, setGuideSent] = useState(false);

  // Added Apple Health to the supported providers
  const providers = [
    { id: 'apple_health', name: 'Apple Health', icon: 'apple', color: '#DE4B4E' },
    { id: 'fitbit', name: 'Fitbit', icon: 'fitbit', color: '#00B0B9' },
    { id: 'garmin', name: 'Garmin', icon: 'garmin', color: '#007CC3' },
    { id: 'oura', name: 'Oura Ring', icon: 'oura', color: '#000000' },
    { id: 'whoop', name: 'Whoop', icon: 'whoop', color: '#E31837' }
  ];

  // 1. Fetch current connections on load
  useEffect(() => {
    const fetchConnections = async () => {
        const saved = JSON.parse(localStorage.getItem('connected_wearables') || '[]');
        setConnectedProviders(saved);
    };
    fetchConnections();
  }, []);

  // 2. Handle Connect (Add Tracker)
  const handleConnect = async (providerId) => {
    setLoading(true);
    
    setTimeout(() => {
        const newList = [...connectedProviders, providerId];
        setConnectedProviders(newList);
        localStorage.setItem('connected_wearables', JSON.stringify(newList));
        localStorage.setItem('deviceConnected', 'true'); 
        setLoading(false);
    }, 1500);
  };

  // 3. Handle Disconnect (Delete Tracker)
  const handleDisconnect = async (providerId) => {
    if (window.confirm("Are you sure you want to disconnect this tracker? Data sync will stop.")) {
        const newList = connectedProviders.filter(id => id !== providerId);
        setConnectedProviders(newList);
        localStorage.setItem('connected_wearables', JSON.stringify(newList));
        
        if (newList.length === 0) {
            localStorage.setItem('deviceConnected', 'false');
        }
    }
  };

  // 4. Handle Sending the Email Guide
  const handleSendSetupGuide = async () => {
    setIsSendingGuide(true);
    
    // Simulating sending an email via Supabase/Resend
    setTimeout(() => {
      setIsSendingGuide(false);
      setGuideSent(true);
      
      // Reset the button after 3 seconds
      setTimeout(() => setGuideSent(false), 3000);
    }, 1500);
  };

  // Styles
  const cardStyle = { background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };

  return (
    <div style={cardStyle}>
      <h2 style={{marginTop: 0, marginBottom: '10px', fontSize: '1.5rem'}}>Connected Apps</h2>
      <p style={{color: '#666', marginBottom: '30px'}}>
        Manage your connections with the Open Wearable API. Data syncs automatically.
      </p>

      {providers.map((provider) => {
        const isConnected = connectedProviders.includes(provider.id);

        return (
          <div key={provider.id} style={{
              display: 'flex', flexDirection: 'column', 
              padding: '20px', border: '1px solid #eee', borderRadius: '15px', marginBottom: '15px',
              transition: 'all 0.2s',
              borderColor: isConnected ? provider.color : '#eee',
              backgroundColor: isConnected ? `${provider.color}08` : 'white'
          }}>
            
            {/* --- TOP ROW: Icon, Name, and Connect Button --- */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{
                    width: '50px', height: '50px', borderRadius: '12px', 
                    backgroundColor: isConnected ? provider.color : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isConnected ? 'white' : '#999'
                }}>
                    <FiWatch size={24} />
                </div>
                <div>
                    <h3 style={{margin: 0, fontSize: '1rem'}}>{provider.name}</h3>
                    <div style={{fontSize: '0.85rem', color: isConnected ? '#4CAF50' : '#999', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px'}}>
                        {isConnected ? <><FiCheckCircle size={12}/> Synced</> : 'Not Connected'}
                    </div>
                </div>
                </div>

                {isConnected ? (
                    <button 
                        onClick={() => handleDisconnect(provider.id)}
                        style={{
                            padding: '8px 16px', borderRadius: '30px', border: '1px solid #ffcccb', 
                            backgroundColor: '#fff5f5', color: '#d32f2f', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <FiTrash2 /> Disconnect
                    </button>
                ) : (
                    <button 
                        onClick={() => handleConnect(provider.id)}
                        disabled={loading}
                        style={{
                            padding: '8px 20px', borderRadius: '30px', border: 'none', 
                            backgroundColor: '#333', color: 'white', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        {loading ? 'Connecting...' : <><FiPlus /> Connect</>}
                    </button>
                )}
            </div>

            {/* --- BOTTOM ROW: Apple Health Email Setup Guide --- */}
            {provider.id === 'apple_health' && !isConnected && (
                <div style={{ backgroundColor: '#F9F9F9', padding: '15px', borderRadius: '12px', marginTop: '20px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '15px', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                        Don't have time to connect your iPhone right now? We can send a step-by-step setup guide directly to your email so you can do it later.
                    </p>
                    
                    <button 
                        onClick={handleSendSetupGuide}
                        disabled={isSendingGuide || guideSent}
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px',
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: guideSent ? '#2ECC71' : 'transparent',
                            color: guideSent ? 'white' : '#333',
                            border: `1px solid ${guideSent ? '#2ECC71' : '#ccc'}`,
                            fontWeight: '600',
                            cursor: (isSendingGuide || guideSent) ? 'default' : 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isSendingGuide ? (
                        'Sending...'
                        ) : guideSent ? (
                        <><FiCheck size={18} /> Guide Sent to Email!</>
                        ) : (
                        <><FiMail size={18} /> Email Me the Setup Guide</>
                        )}
                    </button>
                </div>
            )}

          </div>
        );
      })}

      {/* Info Footer */}
      <div style={{marginTop: '30px', padding: '15px', backgroundColor: '#F0F8FF', borderRadius: '12px', display: 'flex', gap: '10px'}}>
          <FiActivity color="#007bff" style={{marginTop: '2px'}} />
          <div>
              <h4 style={{margin: '0 0 5px 0', fontSize: '0.9rem', color: '#0056b3'}}>How this works</h4>
              <p style={{margin: 0, fontSize: '0.8rem', color: '#555'}}>
                  We use the Open Wearable API to fetch stats like Steps, Heart Rate, and Sleep. 
                  Adding a tracker here will immediately update your Dashboard.
              </p>
          </div>
      </div>

    </div>
  );
};

export default ConnectedApps;