import React, { useState, useEffect } from 'react';
import { FiActivity, FiCheckCircle, FiPlus, FiTrash2, FiWatch } from 'react-icons/fi';
import { supabase } from '../../../supabase';

const ConnectedApps = () => {
  const [loading, setLoading] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState([]);

  // Mock list of supported Open Wearable API providers
  const providers = [
    { id: 'fitbit', name: 'Fitbit', icon: 'fitbit', color: '#00B0B9' },
    { id: 'garmin', name: 'Garmin', icon: 'garmin', color: '#007CC3' },
    { id: 'oura', name: 'Oura Ring', icon: 'oura', color: '#000000' },
    { id: 'whoop', name: 'Whoop', icon: 'whoop', color: '#E31837' }
  ];

  // 1. Fetch current connections on load
  useEffect(() => {
    const fetchConnections = async () => {
        // For now, we simulate persistence using LocalStorage
        // In a real app, you would fetch this from Supabase: 
        // const { data } = await supabase.from('user_integrations').select('*');
        
        const saved = JSON.parse(localStorage.getItem('connected_wearables') || '[]');
        setConnectedProviders(saved);
    };
    fetchConnections();
  }, []);

  // 2. Handle Connect (Add Tracker)
  const handleConnect = async (providerId) => {
    setLoading(true);
    
    // Simulate Open Wearable API Handshake
    setTimeout(() => {
        const newList = [...connectedProviders, providerId];
        setConnectedProviders(newList);
        localStorage.setItem('connected_wearables', JSON.stringify(newList));
        
        // Also update the flag for the Dashboard to know data is ready
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

  // Styles
  const cardStyle = { background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
  const providerItemStyle = { 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '20px', border: '1px solid #eee', borderRadius: '15px', marginBottom: '15px',
      transition: 'all 0.2s'
  };

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
              ...providerItemStyle, 
              borderColor: isConnected ? provider.color : '#eee',
              backgroundColor: isConnected ? `${provider.color}08` : 'white' // 5% opacity background
          }}>
            
            {/* Left: Icon & Name */}
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
               <div style={{
                   width: '50px', height: '50px', borderRadius: '12px', 
                   backgroundColor: isConnected ? provider.color : '#f5f5f5',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: isConnected ? 'white' : '#999'
               }}>
                  {/* Simple generic watch icon, or custom SVGs if you have them */}
                  <FiWatch size={24} />
               </div>
               <div>
                   <h3 style={{margin: 0, fontSize: '1rem'}}>{provider.name}</h3>
                   <div style={{fontSize: '0.85rem', color: isConnected ? '#4CAF50' : '#999', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px'}}>
                       {isConnected ? <><FiCheckCircle size={12}/> Synced</> : 'Not Connected'}
                   </div>
               </div>
            </div>

            {/* Right: Action Button */}
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