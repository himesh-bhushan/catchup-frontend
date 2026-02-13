import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // --- GOOGLE HEALTH HANDSHAKE ---
  const handleGoogleConnect = () => {
    if (!user) return;
    
    // Uses the Client ID from your Vercel Environment Variables
    const clientID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectURI = encodeURIComponent("https://catchup-backend-6bpf.onrender.com/api/auth/google/callback");
    
    // State passes the Supabase UID so the backend knows which profile to update
    const state = user.id; 
    
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/fitness.activity.read " +
      "https://www.googleapis.com/auth/fitness.body.read"
    );
    
    // Construct the secure Google OAuth2 URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `response_type=code&` +
                    `client_id=${clientID}&` +
                    `redirect_uri=${redirectURI}&` +
                    `scope=${scope}&` +
                    `access_type=offline&` +
                    `prompt=consent&` +
                    `state=${state}`;
    
    window.location.href = authUrl;
  };

  // --- HELPER: Distance Calc ---
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
                    phone: "+1 234-567-8900",
                    status: status,
                    isOpen: status.includes("Open")
                };
            });
            formattedClinics.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setClinics(formattedClinics);
        }
    } catch (err) { console.error("Nominatim Error:", err); } finally { setLocationLoading(false); }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => { fetchNearbyClinics(position.coords.latitude, position.coords.longitude); },
        () => { alert("Location access denied."); setLocationLoading(false); }
      );
    }
  };

  const openGoogleMaps = (clinicName, clinicAddress) => {
      const query = encodeURIComponent(`${clinicName} ${clinicAddress}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const downloadImage = async (path) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  const recommendations = [
    { id: 1, title: t('rec_tomatoes') || "The Health Benefits of Eating Tomatoes", img: tomato, color: "#fff3e0" },
    { id: 2, title: t('rec_heart') || "5 Simple Steps to Better Heart Health", img: heartVisual, color: "#ffebee" },
    { id: 3, title: t('rec_sleep') || "Why Sleep is Your Superpower", img: tomatoHero, color: "#e3f2fd" },
  ];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        setUser(session.user);

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, calorie_goal, avatar_url, google_connected')
                .eq('id', session.user.id)
                .single();
            
            let currentGoal = 500;
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.calorie_goal) currentGoal = profile.calorie_goal;
                if (profile.avatar_url) downloadImage(profile.avatar_url);
                if (profile.google_connected) {
                    setIsDeviceConnected(true);
                    localStorage.setItem('deviceConnected', 'true');
                }
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayLog } = await supabase
                .from('activity_logs')
                .select('calories, steps, distance')
                .eq('user_id', session.user.id)
                .eq('date', todayStr)
                .single();

            const currentCals = todayLog ? todayLog.calories : 0;
            const currentSteps = todayLog ? todayLog.steps : 0;
            const currentDist = todayLog ? todayLog.distance : 0;
            const percent = currentGoal > 0 ? Math.min((currentCals / currentGoal) * 100, 100) : 0;

            setActivityData({
                calories: currentCals,
                steps: currentSteps,
                distance: currentDist,
                goal: currentGoal,
                percentage: percent
            });

            const { data: hrLog } = await supabase
                .from('heart_rate_logs')
                .select('bpm')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            setOtherStats(prev => ({
                ...prev,
                heart_rate: hrLog ? hrLog.bpm : 72 
            }));

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Check for success redirect from Google Auth
    const params = new URLSearchParams(location.search);
    if (params.get('sync') === 'success') {
        alert("Google Fit connected successfully!");
        setIsDeviceConnected(true);
        localStorage.setItem('deviceConnected', 'true');
    }
  }, [fetchDashboardData, location.search]);

  const handleConnectMock = () => {
    setConnecting(true);
    setTimeout(() => { 
        localStorage.setItem('deviceConnected', 'true'); 
        setIsDeviceConnected(true); 
        setConnecting(false); 
    }, 1500);
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardNav />
      <div className="dashboard-content">
        
        <header className="dash-header">
          <div className="mobile-header-top">
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? <img src={avatarUrl} alt="User" className="avatar-img" /> : <FiUser />}
             </div>
             <button className="refresh-btn" onClick={fetchDashboardData}><FiRefreshCw /></button>
          </div>
          <h1 className="dash-title">{t('welcome_message', { name: firstName })}</h1>
        </header>

        {loading ? (
            <div className="big-tile-container"><div className="big-connect-card"><h3>{t('loading_data')}</h3></div></div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container">
                <div className="big-connect-card">
                    {showConnectMenu ? (
                        <div className="connect-device-card-content">
                            <div className="connect-title-row">
                                <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                                <h3 className="connect-device-title">Select Device</h3>
                            </div>
                            <div className="device-btn-container">
                                {/* ✅ GOOGLE HEALTH BUTTON (PROD) */}
                                <button onClick={handleGoogleConnect} className="device-connect-btn google">
                                    <div className="device-label"><FiActivity size={20} /><span>Google Health</span></div>
                                </button>
                                {/* MOCK BUTTONS */}
                                <button onClick={handleConnectMock} className="device-connect-btn fitbit"><div className="device-label"><FiBluetooth size={20} /><span>Fitbit</span></div></button>
                                <button onClick={handleConnectMock} className="device-connect-btn garmin"><div className="device-label"><FiBluetooth size={20} /><span>Garmin</span></div></button>
                            </div>
                            <img src={tomatoHero} alt="Tomato" className="device-illustration" />
                        </div>
                    ) : (
                        <>
                            <div className="icon-pulse"><FiWatch size={60} color="#00796b"/></div>
                            <h2>{t('connect_title')}</h2>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn')}</button>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="dash-grid">
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('activity_ring')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle"><span>{Math.round(activityData.percentage)}%</span></div>
                                </div>
                            </div>
                            <div className="activity-stats">
                                <div className="stat-item"><h4>{t('move')}</h4><p>{activityData.calories}/{activityData.goal} <span className="unit">KCAL</span></p></div>
                                <div className="stat-item"><h4>{t('step_count')}</h4><p>{activityData.steps}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('heart_rate')}</h3><FiHeart color="red" /><FiChevronRight className="card-arrow" /></div>
                        <img alt="Heart Rate" width="80%" src={heartVisual} />
                        <div className="heart-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>
                </div>
                {/* Clinics Section Placeholder */}
                <div className="recommendations-section">
                    <button onClick={handleGetLocation} className="location-btn"><FiNavigation /> {t('use_my_location')}</button>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;