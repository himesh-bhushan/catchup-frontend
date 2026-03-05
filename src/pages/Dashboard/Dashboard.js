import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import axios from 'axios'; 
import DashboardNav from '../../components/DashboardNav';
import { 
  FiChevronRight, FiUser, FiHeart, FiActivity, FiMoon, 
  FiDroplet, FiWatch, FiRefreshCw, FiArrowLeft, FiNavigation, 
  FiBluetooth, FiExternalLink 
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

// Images (Ensuring paths match your projects structure)
import tomatoHero from '../../assets/raise-hand.png';
import heartVisual from '../../assets/heart-rate.png';
import tomato from '../../assets/tomato.png';

// Styles & DB
import './Dashboard.css';
import { supabase } from '../../supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { t } = useTranslation();
  
  // --- STATE ---
  const [firstName, setFirstName] = useState(localStorage.getItem('userName') || "Friend");
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null); 
  const [lastSynced, setLastSynced] = useState(null); 
  
  // Activity Ring Data (Linked to DB)
  const [activityData, setActivityData] = useState({
    calories: 0, steps: 0, distance: 0, goal: 500, percentage: 0
  });

  // Other Stats (Heart Rate Linked to DB)
  const [otherStats, setOtherStats] = useState({
    heart_rate: 72, sleep: 28800 
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
  const [connecting, setConnecting] = useState(false); 
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  
  // Location / Clinics
  const [clinics, setClinics] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // --- REFRESH & SYNC LOGIC ---
  const handleRefreshSync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isDeviceConnected) {
        await axios.post(`https://backend.catchup.page/api/wearables/google-sync/${user.id}`);
      }
      await fetchDashboardData();
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = () => {
    if (!user) return;
    const clientID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectURI = encodeURIComponent("https://backend.catchup.page/api/auth/google/callback");
    const state = user.id; 
    const scope = encodeURIComponent("https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
    window.location.href = authUrl;
  };

  // --- LOCATION LOGIC ---
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI/180);
    const dLon = (lon2 - lon1) * (Math.PI/180); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  };

  const getMockStatus = () => {
      const statuses = ["Open Now", "Closing Soon", "Closed", "Open 24/7"];
      return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const fetchNearbyClinics = async (lat, lng) => {
    try {
        setLocationLoading(true);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=clinic&limit=4&viewbox=${lng-0.05},${lat+0.05},${lng+0.05},${lat-0.05}&bounded=1`);
        const data = await response.json();
        if (data.length > 0) {
            const formattedClinics = data.map(item => {
                const status = getMockStatus();
                return {
                    id: item.place_id,
                    name: item.display_name.split(",")[0],
                    fullAddress: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    distance: getDistance(lat, lng, parseFloat(item.lat), parseFloat(item.lon)),
                    status: status,
                    isOpen: status.includes("Open")
                };
            });
            formattedClinics.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setClinics(formattedClinics);
        } else { alert("No clinics found nearby."); }
    } catch (err) { console.error("Nominatim Error:", err); } finally { setLocationLoading(false); }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => { fetchNearbyClinics(position.coords.latitude, position.coords.longitude); },
        () => { alert("Location access denied."); setLocationLoading(false); }
      );
    } else { alert("Browser does not support geolocation"); }
  };

  const openGoogleMaps = (clinicName, clinicAddress) => {
      const query = encodeURIComponent(`${clinicName} ${clinicAddress}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // --- IMAGE DOWNLOADER ---
  const downloadImage = useCallback(async (path) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }, []);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        setUser(session.user);
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, calorie_goal, avatar_url, google_connected, last_synced_at')
                .eq('id', session.user.id)
                .single();
            
            let currentGoal = 500;
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.calorie_goal) currentGoal = profile.calorie_goal;
                
                if (profile.avatar_url) {
                    const fileName = profile.avatar_url.split('/').pop();
                    downloadImage(fileName);
                }
                if (profile.google_connected) setIsDeviceConnected(true);
                if (profile.last_synced_at) {
                    const date = new Date(profile.last_synced_at);
                    setLastSynced(date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
                }
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayLog } = await supabase.from('activity_logs').select('*').eq('user_id', session.user.id).eq('date', todayStr).maybeSingle();

            const cals = todayLog?.calories || 0;
            const percent = currentGoal > 0 ? Math.min((cals / currentGoal) * 100, 100) : 0;

            setActivityData({
                calories: cals, steps: todayLog?.steps || 0, distance: todayLog?.distance || 0, goal: currentGoal, percentage: percent
            });

            const { data: hrLog } = await supabase.from('heart_rate_logs').select('bpm').eq('user_id', session.user.id).order('date', { ascending: false }).limit(1).maybeSingle();
            setOtherStats(prev => ({ ...prev, heart_rate: hrLog ? hrLog.bpm : 72 }));
        } catch (err) { console.error("Error fetching dashboard data:", err); }
    }
    setLoading(false);
  }, [downloadImage]);

  // --- INITIAL EFFECT ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- CONNECT LOGIC MOCK ---
  const handleConnectProvider = () => {
    if (!user) return;
    setConnecting(true);
    setTimeout(() => { 
        localStorage.setItem('deviceConnected', 'true'); 
        setIsDeviceConnected(true); 
        fetchDashboardData(); 
        setConnecting(false); 
    }, 2000);
  };

  // --- RENDER ---
  return (
    <div className="dashboard-wrapper">
      <DashboardNav />
      <div className="dashboard-content">
        <header className="dash-header">
          <div className="mobile-header-top">
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? <img src={avatarUrl} alt="User" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : <FiUser />}
             </div>
             <button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button>
          </div>
          <div className="header-flex">
            <div className="header-text-group">
                <h1 className="desktop-title">{t('welcome_message', { name: firstName })}</h1>
                {lastSynced && <p className="last-synced-label" style={{fontSize: '0.85rem',color: '#000000', opacity: 0.7, margin: '4px 0 0 0'}}>Last updated: {lastSynced}</p>}
                <h1 className="mobile-title">{t('welcome_message', { name: firstName })}</h1>
            </div>
            <div className="desktop-title"><button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button></div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container animate-fade-in"><div className="big-connect-card"><h3>Syncing wellness data...</h3></div></div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container animate-fade-in">
                <div className="big-connect-card" style={{ minHeight: '450px', justifyContent: 'center' }}>
                    {showConnectMenu ? (
                        <div className="fade-in-up connect-device-card-content">
                            <div className="connect-title-row">
                                <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                                <h3 className="connect-device-title">Select Device</h3>
                            </div>
                            <div className="device-btn-container">
                                <button onClick={handleGoogleConnect} className="device-connect-btn oura" style={{backgroundColor:'#000', color:'#fff'}}>Connect Oura</button>
                                <button onClick={() => handleConnectProvider()} className="device-connect-btn fitbit" disabled={connecting}>Connect Fitbit</button>
                            </div>
                            <img src={tomatoHero} alt="Tomato" className="device-illustration" />
                        </div>
                    ) : (
                        <>
                            <div className="icon-pulse"><FiWatch size={60} color="#00796b"/></div>
                            <h2>{t('connect_title') || "Let's Get Connected"}</h2>
                            <p>{t('connect_desc') || "Connect your wearable device to unlock your health dashboard."}</p>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn') || "Connect Tracker"}</button>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="dash-grid">
                    {/* Activity Ring */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('activity_ring') || "Activity Ring"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                        <div className="ring-wrapper">
                            <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                <div className="inner-circle"><img alt="Tomato" width="60%" src={tomato} /><span>{Math.round(activityData.percentage)}%</span></div>
                            </div>
                        </div>
                        <div className="activity-stats">
                            <div className="stat-item"><h4>{t('move')}</h4><p>{activityData.calories}/{activityData.goal} <span className="unit">KCAL</span></p></div>
                            <div className="stat-item"><h4>{t('step_count')}</h4><p>{activityData.steps}</p></div>
                        </div>
                        </div>
                    </div>

                    {/* Goals Completed */}
                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('goals_completed') || "Goals Completed"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-progress-bar">
                            <div className="progress-fill" style={{width: '75%'}}></div>
                            <img alt="Tomato" width="100%" src={tomato} className="progress-tomato"  />
                            <span className="progress-text">3/4</span>
                        </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('blood_pressure') || "Blood Pressure"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="bp-value">120/80 <span>mmHg</span></div>
                    </div>

                    {/* Health Score */}
                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('health_score') || "Health Score"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-big">87 <span>SCORE</span></div>
                    </div>

                    {/* Heart Rate */}
                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('heart_rate') || "Heart Rate"}</h3><FiHeart className="card-icon-red" /><FiChevronRight className="card-arrow" /></div>
                        <div className="heart-visuals" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <img alt="Heart Rate" width="80%" src={heartVisual} /></div>
                        <div className="heart-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    {/* Fight Card */}
                    <div className="card fight-card">
                        <div className="speech-bubble">{t('fight_msg') || "Fight For Yourself"}</div>
                        <img src={tomatoHero} alt="Fit Tomato" className="fight-tomato" />
                    </div>
                </div>

                {/*Recommendations, Find Nearby Care would go here (truncated for brevity based on context of request) */}
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;