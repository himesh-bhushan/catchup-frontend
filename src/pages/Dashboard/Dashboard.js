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
  
  const [activityData, setActivityData] = useState({
    calories: 0, steps: 0, distance: 0, goal: 500, percentage: 0
  });

  const [otherStats, setOtherStats] = useState({
    heart_rate: 72, sleep: 28800
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
  const [connecting, setConnecting] = useState(false); 
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  
  const [clinics, setClinics] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // ✅ REFRESH + SYNC Logic
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

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI/180);
    const dLon = (lon2 - lon1) * (Math.PI/180); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  };

  const openGoogleMaps = (clinicName, clinicAddress) => {
      const query = encodeURIComponent(`${clinicName} ${clinicAddress}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const downloadImage = async (path) => {
    try {
      // ✅ FIXED: Filename extractor for full URL strings
      const fileName = path.includes('/') ? path.split('/').pop() : path;
      const { data, error } = await supabase.storage.from('avatars').download(fileName);
      if (error) throw error;
      setAvatarUrl(URL.createObjectURL(data));
    } catch (error) {
      console.log('Error downloading image');
    }
  };

  const recommendations = [
    { id: 1, title: t('rec_tomatoes'), img: tomato, color: "#fff3e0" },
    { id: 2, title: t('rec_heart'), img: heartVisual, color: "#ffebee" },
    { id: 3, title: t('rec_sleep'), img: tomatoHero, color: "#e3f2fd" },
    { id: 4, title: t('rec_water'), img: tomato, color: "#e0f7fa" },
    { id: 5, title: t('rec_bp'), img: heartVisual, color: "#f3e5f5" },
    { id: 6, title: t('rec_move'), img: tomatoHero, color: "#e8f5e9" },
  ];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        setUser(session.user);
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.avatar_url) downloadImage(profile.avatar_url);
                if (profile.google_connected) {
                    setIsDeviceConnected(true);
                    localStorage.setItem('deviceConnected', 'true');
                }
            }
            const todayStr = new Date().toISOString().split('T')[0];
            // ✅ FIXED: maybeSingle to prevent 406 error
            const { data: todayLog } = await supabase.from('activity_logs').select('*').eq('user_id', session.user.id).eq('date', todayStr).maybeSingle();

            const currentGoal = profile?.calorie_goal || 500;
            const cals = todayLog ? todayLog.calories : 0;
            setActivityData({
                calories: cals,
                steps: todayLog ? todayLog.steps : 0,
                distance: todayLog ? todayLog.distance : 0,
                goal: currentGoal,
                percentage: currentGoal > 0 ? Math.min((cals / currentGoal) * 100, 100) : 0
            });
            const { data: hrLog } = await supabase.from('heart_rate_logs').select('bpm').eq('user_id', session.user.id).order('date', { ascending: false }).limit(1).maybeSingle();
            setOtherStats(prev => ({ ...prev, heart_rate: hrLog ? hrLog.bpm : 72 }));
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    }
    setLoading(false);
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => { /* fetch logic */ setLocationLoading(false); },
        () => { setLocationLoading(false); }
      );
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const params = new URLSearchParams(location.search);
    if (params.get('sync') === 'success') {
        setIsDeviceConnected(true);
        localStorage.setItem('deviceConnected', 'true');
        setShowConnectMenu(false);
        navigate('/dashboard', { replace: true });
        fetchDashboardData();
    }
  }, [fetchDashboardData, location.search, navigate]);

  return (
    <div className="dashboard-wrapper">
      <DashboardNav />
      <div className="dashboard-content">
        <header className="dash-header">
          <div className="mobile-header-top">
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? <img src={avatarUrl} alt="User" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : <FiUser />}
             </div>
             {/* ✅ UPDATED: Mobile Refresh now triggers Sync */}
             <button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button>
          </div>
          <div className="header-flex">
            <div><h1 className="desktop-title">{t('welcome_message', { name: firstName })}</h1></div>
            {/* ✅ UPDATED: Desktop Refresh now triggers Sync */}
            <div className="desktop-title"><button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button></div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container"><div className="big-connect-card"><div className="icon-pulse"><img alt="Tomato" width="80%" src={tomato} /></div><h3>Syncing...</h3></div></div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container"><div className="big-connect-card">
                {showConnectMenu ? (
                    <div className="connect-device-card-content">
                        <div className="connect-title-row"><button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button><h3>Select Device</h3></div>
                        <div className="device-btn-container">
                            <button onClick={handleGoogleConnect} className="device-connect-btn oura" style={{backgroundColor:'#000', color:'#fff'}}>Connect Oura</button>
                            <button onClick={handleRefreshSync} className="device-connect-btn fitbit">Connect Fitbit</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="icon-pulse"><FiWatch size={60} color="#00796b"/></div>
                        <h2>{t('connect_title')}</h2>
                        <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn')}</button>
                    </>
                )}
            </div></div>
        ) : (
            <div className="animate-fade-in">
                <div className="dash-grid">
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('activity_ring')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle"><img alt="Tomato" width="60%" src={tomato} /><span>{Math.round(activityData.percentage)}%</span></div>
                                </div>
                            </div>
                            <div className="activity-stats">
                                <div className="stat-item"><h4>{t('move')}</h4><p>{activityData.calories}/{activityData.goal} KCAL</p></div>
                                <div className="stat-item"><h4>{t('step_count')}</h4><p>{activityData.steps}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('goals_completed')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-progress-bar"><div className="progress-fill" style={{width: '75%'}}></div><img alt="Tomato" width="100%" src={tomato} className="progress-tomato"  /><span className="progress-text">3/4</span></div>
                        <div className="goals-grid">
                            <div className="goal-item"><div className="dot green"></div><div><h5>Steps</h5><p>{activityData.steps}</p></div></div>
                            <div className="goal-item"><div className="dot green"></div><div><h5>Sleep</h5><p>{(otherStats.sleep/3600).toFixed(1)}h</p></div></div>
                        </div>
                    </div>

                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>Blood Pressure</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="bp-value">120/80 <span>mmHg</span></div>
                    </div>

                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>Health Score</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-big">87 <span>SCORE</span></div>
                        <div className="score-details-grid">
                            <div className="score-mini-box red"><FiHeart /><span>Heart</span><strong>{otherStats.heart_rate}</strong></div>
                            <div className="score-mini-box yellow"><FiActivity /><span>Cal</span><strong>{activityData.calories}</strong></div>
                            <div className="score-mini-box blue"><FiDroplet /><span>Water</span><strong>2 L</strong></div>
                        </div>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>Heart Rate</h3><FiHeart color="red" /><FiChevronRight className="card-arrow" /></div>
                        <div className="heart-visuals"><img alt="Heart" width="80%" src={heartVisual} /></div>
                        <div className="heart-value">{otherStats.heart_rate} BPM</div>
                    </div>
                </div>

                <div className="recommendations-section">
                    <h3>{t('recommendations')}</h3>
                    <div className="recommendations-carousel">
                        {recommendations.map((blog) => (
                            <div key={blog.id} className="blog-card" onClick={() => console.log('Open blog', blog.id)}>
                                <div className="blog-img-wrapper" style={{backgroundColor: blog.color}}><img src={blog.img} alt={blog.title} /></div>
                                <div className="blog-content"><p>{blog.title}</p></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="recommendations-section">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                        <h3>Find Nearby Care</h3>
                        <button onClick={handleGetLocation} className="connect-btn" style={{padding:'8px 15px'}}><FiNavigation /> {locationLoading ? 'Locating...' : 'Use My Location'}</button>
                    </div>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;