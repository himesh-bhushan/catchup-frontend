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
    calories: 0, steps: 0, distance: 0, goal: 500, percentage: 0
  });

  const [otherStats, setOtherStats] = useState({
    heart_rate: 72, sleep: 28800 
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // --- REFRESH / SYNC ---
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
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=https://www.googleapis.com/auth/fitness.activity.read%20https://www.googleapis.com/auth/fitness.body.read&access_type=offline&prompt=consent&state=${user.id}`;
    window.location.href = authUrl;
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
                .eq('id', session.user.id).single();
            
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.avatar_url) {
                    const fileName = profile.avatar_url.split('/').pop();
                    const { data: img } = await supabase.storage.from('avatars').download(fileName);
                    if (img) setAvatarUrl(URL.createObjectURL(img));
                }
                if (profile.google_connected) setIsDeviceConnected(true);
                if (profile.last_synced_at) {
                    const date = new Date(profile.last_synced_at);
                    setLastSynced(date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
                }
            }

            const today = new Date().toISOString().split('T')[0];
            const { data: log } = await supabase.from('activity_logs').select('*').eq('user_id', session.user.id).eq('date', today).maybeSingle();
            
            const goal = profile?.calorie_goal || 500;
            const cals = log?.calories || 0;

            setActivityData({
                calories: cals,
                steps: log?.steps || 0,
                distance: log?.distance || 0,
                goal: goal,
                percentage: goal > 0 ? Math.min((cals / goal) * 100, 100) : 0
            });

            const { data: hr } = await supabase.from('heart_rate_logs').select('bpm').eq('user_id', session.user.id).order('date', {ascending: false}).limit(1).maybeSingle();
            setOtherStats(prev => ({ ...prev, heart_rate: hr ? hr.bpm : 72 }));

        } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

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
            <div className="desktop-only-refresh">
                <button className="refresh-btn" onClick={handleRefreshSync}>
                    <FiRefreshCw className={loading ? "icon-spin" : ""} />
                </button>
            </div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container"><div className="big-connect-card"><h3>{t('loading_data')}</h3></div></div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container">
                <div className="big-connect-card">
                    {showConnectMenu ? (
                        <div className="connect-device-card-content">
                            <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                            <h3>Select Device</h3>
                            <button onClick={handleGoogleConnect} className="device-connect-btn oura">Connect Oura</button>
                            <button className="device-connect-btn fitbit">Connect Fitbit</button>
                        </div>
                    ) : (
                        <>
                            <FiWatch size={60} color="#00796b"/>
                            <h2>{t('connect_title')}</h2>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn')}</button>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                {/* --- MAIN GRID START --- */}
                <div className="dash-grid">
                    
                    {/* Activity: Spans 2 cols on Mobile / 1 col on Desktop */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('Activity')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle"><img alt="Tomato" src={tomato} width="40" /><span>{Math.round(activityData.percentage)}%</span></div>
                                </div>
                            </div>
                            <div className="activity-stats">
                                <div className="stat-item"><h4>Move</h4><p>{activityData.calories} <span className="unit">KCAL</span></p></div>
                                <div className="stat-item"><h4>Steps</h4><p>{activityData.steps}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Goals: Right side on Desktop / Below Activity on Mobile */}
                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('Goals')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-display">
                            <span className="goals-count">3/4</span>
                            <p>Goals Completed Today</p>
                        </div>
                        <div className="progress-bar-simple"><div className="fill" style={{width: '75%'}}></div></div>
                    </div>

                    {/* Small Tiles */}
                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('BP')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">120/80</div>
                        <span className="unit-label">mmHg</span>
                    </div>

                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('Score')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">87</div>
                        <span className="unit-label">Health Pts</span>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('Heart')}</h3><FiHeart className="card-icon-red" /></div>
                        <div className="tile-value">{otherStats.heart_rate}</div>
                        <span className="unit-label">BPM</span>
                    </div>

                    <div className="card fight-card mobile-only">
                        <img src={tomatoHero} alt="Fit Tomato" className="fight-tomato" />
                        <p>Keep going!</p>
                    </div>
                </div>
                {/* --- MAIN GRID END --- */}
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;