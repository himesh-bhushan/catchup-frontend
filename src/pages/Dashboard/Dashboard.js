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

// Images
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
  
  const [activityData, setActivityData] = useState({
    calories: 0,
    steps: 0,
    distance: 0,
    goal: 500, 
    percentage: 0
  });

  const [otherStats, setOtherStats] = useState({
    heart_rate: 72, 
    sleep: 28800 
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
  const [connecting, setConnecting] = useState(false); 
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  
  const [clinics, setClinics] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // --- SYNC LOGIC ---
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

  // --- CLINIC / LOCATION LOGIC ---
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI/180);
    const dLon = (lon2 - lon1) * (Math.PI/180); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  };

  const fetchNearbyClinics = async (lat, lng) => {
    try {
        setLocationLoading(true);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=clinic&limit=4&viewbox=${lng-0.05},${lat+0.05},${lng+0.05},${lat-0.05}&bounded=1`);
        const data = await response.json();
        if (data.length > 0) {
            const formattedClinics = data.map(item => ({
                id: item.place_id,
                name: item.display_name.split(",")[0],
                fullAddress: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                distance: getDistance(lat, lng, parseFloat(item.lat), parseFloat(item.lon)),
                status: "Open Now",
                isOpen: true
            }));
            formattedClinics.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setClinics(formattedClinics);
        }
    } catch (err) { console.error("Clinic Fetch Error:", err); } finally { setLocationLoading(false); }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => { fetchNearbyClinics(position.coords.latitude, position.coords.longitude); },
        () => { setLocationLoading(false); }
      );
    }
  };

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
                    const { data: imgData } = await supabase.storage.from('avatars').download(fileName);
                    if (imgData) setAvatarUrl(URL.createObjectURL(imgData));
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
            setActivityData({
                calories: cals,
                steps: todayLog?.steps || 0,
                distance: todayLog?.distance || 0,
                goal: currentGoal,
                percentage: currentGoal > 0 ? Math.min((cals / currentGoal) * 100, 100) : 0
            });

            const { data: hrLog } = await supabase.from('heart_rate_logs').select('bpm').eq('user_id', session.user.id).order('date', { ascending: false }).limit(1).maybeSingle();
            setOtherStats(prev => ({ ...prev, heart_rate: hrLog ? hrLog.bpm : 72 }));

        } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- RENDER ---
  return (
    <div className="dashboard-wrapper">
      <DashboardNav />
      <div className="dashboard-content">
        
        <header className="dash-header">
          <div className="mobile-header-top">
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? <img src={avatarUrl} alt="User" className="avatar-img-circle" /> : <FiUser />}
             </div>
             <button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button>
          </div>
          <div className="header-flex">
            <div className="header-text-group">
                <h1 className="desktop-title">{t('welcome_message', { name: firstName })}</h1>
                <h1 className="mobile-title">{t('welcome_message', { name: firstName })}</h1>
                {lastSynced && <p className="last-synced-label">Last updated: {lastSynced}</p>}
            </div>
            <div className="desktop-only-refresh"><button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button></div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container animate-fade-in">
                <div className="big-connect-card">
                    <div className="icon-pulse"><img alt="Tomato" width="80%" src={tomato} /></div>
                    <h3>{t('loading_data')}</h3>
                </div>
            </div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container animate-fade-in">
                <div className="big-connect-card">
                    {showConnectMenu ? (
                        <div className="connect-device-card-content">
                            <div className="connect-title-row">
                                <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                                <h3 className="connect-device-title">Select Device</h3>
                            </div>
                            <div className="device-btn-container">
                                <button onClick={handleGoogleConnect} className="device-connect-btn oura">Connect Oura</button>
                                <button className="device-connect-btn fitbit">Connect Fitbit</button>
                            </div>
                        </div>
                    ) : (
                        <div className="connect-prompt">
                            <FiWatch size={60} color="#00796b"/>
                            <h2>{t('connect_title')}</h2>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn')}</button>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                {/* GRID START: 2-column Mobile / 3-column Desktop */}
                <div className="dash-grid">
                    
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('Activity')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle"><img alt="Tomato" src={tomato} /><span>{Math.round(activityData.percentage)}%</span></div>
                                </div>
                            </div>
                            <div className="activity-stats">
                                <div className="stat-item"><h4>Move</h4><p>{activityData.calories} <span className="unit">KCAL</span></p></div>
                                <div className="stat-item"><h4>Steps</h4><p>{activityData.steps}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('Goals')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-mini-display">3/4 Completed</div>
                        <div className="progress-bar-simple"><div className="fill" style={{width: '75%'}}></div></div>
                    </div>

                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('BP')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="bp-value">120/80 <span>mmHg</span></div>
                    </div>

                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('Score')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-big">87 <span>PTS</span></div>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('Heart')}</h3><FiHeart className="card-icon-red" /></div>
                        <div className="heart-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    <div className="card fight-card mobile-only">
                        <div className="speech-bubble">Keep it up!</div>
                        <img src={tomatoHero} alt="Fit Tomato" className="fight-tomato" />
                    </div>
                </div>

                {/* Recommendations */}
                <div className="recommendations-section">
                    <h3>{t('recommendations')}</h3>
                    <div className="recommendations-carousel">
                        {[1,2,3].map(i => (
                            <div key={i} className="blog-card">
                                <div className="blog-img-wrapper" style={{backgroundColor: '#fff3e0'}}><img src={tomato} alt="blog" /></div>
                                <div className="blog-content"><p>Wellness Tip #{i}</p></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clinics */}
                <div className="recommendations-section">
                    <div className="section-header-flex">
                        <h3>{t('nearby_care')}</h3>
                        <button onClick={handleGetLocation} className="loc-btn"><FiNavigation /> {locationLoading ? '...' : 'Find'}</button>
                    </div>
                    <div className="clinics-grid-container">
                        {clinics.map(c => (
                            <div key={c.id} className="clinic-tile">
                                <h4>{c.name}</h4>
                                <p>{c.distance} km away</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;