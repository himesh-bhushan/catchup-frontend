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

// Images (Ensure these paths match your project)
import tomatoHero from '../../assets/raise-hand.png';
import heartVisual from '../../assets/heart-rate.png';
import tomato from '../../assets/tomato.png';
import awards from '../../assets/awards.png';

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
  
  // ✅ FIX: Re-added the missing state variables
  const [lastSynced, setLastSynced] = useState(null); 
  const [lastSyncedAgo, setLastSyncedAgo] = useState(null);
  
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

  // --- HELPER: TIME AGO ---
  const calculateTimeAgo = (dateString) => {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

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

  // --- LOCATION LOGIC ---
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
    } catch (err) { console.error(err); } finally { setLocationLoading(false); }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => fetchNearbyClinics(position.coords.latitude, position.coords.longitude),
        () => setLocationLoading(false)
      );
    }
  };

  const openGoogleMaps = (name, address) => {
      window.open(`http://googleusercontent.com/maps.google.com/?q=${name} ${address}`, '_blank');
  };

  // --- RECOMMENDATIONS ---
  const recommendations = [
    { id: 1, title: t('rec_tomatoes') || "Health Benefits of Tomatoes", img: tomato, color: "#fff3e0" },
    { id: 2, title: t('rec_heart') || "Better Heart Health", img: heartVisual, color: "#ffebee" },
    { id: 3, title: t('rec_sleep') || "Why Sleep is Important", img: tomatoHero, color: "#e3f2fd" },
  ];

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
                
                // ✅ UPDATE SYNC TIME AND RELATIVE TIME
                if (profile.last_synced_at) {
                    const date = new Date(profile.last_synced_at);
                    setLastSynced(date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
                    setLastSyncedAgo(calculateTimeAgo(profile.last_synced_at));
                }
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayLog } = await supabase.from('activity_logs').select('*').eq('user_id', session.user.id).eq('date', todayStr).maybeSingle();
            
            const goal = profile?.calorie_goal || 500;
            const cals = todayLog?.calories || 0;

            setActivityData({
                calories: cals, steps: todayLog?.steps || 0, distance: todayLog?.distance || 0, goal: goal,
                percentage: goal > 0 ? Math.min((cals / goal) * 100, 100) : 0
            });

            const { data: hr } = await supabase.from('heart_rate_logs').select('bpm').eq('user_id', session.user.id).order('date', {ascending: false}).limit(1).maybeSingle();
            setOtherStats(prev => ({ ...prev, heart_rate: hr ? hr.bpm : 72 }));

        } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

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
             <button className="refresh-btn" onClick={handleRefreshSync}>
                <FiRefreshCw className={loading ? "icon-spin" : ""} />
             </button>
          </div>
          
          <div className="header-flex">
            {/* ✅ NEW BEAUTIFUL HEADER TEXT GROUP */}
            <div className="header-text-group">
                <h1 className="desktop-title">Welcome back, {firstName}</h1>
                <h1 className="mobile-title">Hi, {firstName} <br/> Have a nice day</h1>
                
                {lastSynced && (
                    <div className="last-synced-wrapper">
                        <FiRefreshCw className={`sync-icon-small ${loading ? "icon-spin" : ""}`} />
                        <p className="last-synced-label">
                            Last updated: {lastSynced} <span className="sync-time-ago">({lastSyncedAgo})</span>
                        </p>
                    </div>
                )}
            </div>
            
            <div className="desktop-only-refresh">
                <button className="refresh-btn" onClick={handleRefreshSync}>
                    <FiRefreshCw className={loading ? "icon-spin" : ""} />
                </button>
            </div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container"><div className="big-connect-card"><h3>{t('loading_data') || 'Syncing data...'}</h3></div></div>
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
                            <h2>{t('connect_title') || 'Connect Tracker'}</h2>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn') || 'Connect'}</button>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                
                {/* --- MAIN GRID START --- */}
                <div className="dash-grid">
                    
                    {/* Activity Ring */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('Activity Ring')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle">
                                        <img alt="Tomato" src={tomato} width="40" />
                                        <span>Great!</span>
                                    </div>
                                </div>
                            </div>
                            <div className="activity-stats">
                                <div className="stat-item"><h4>Move</h4><p>{activityData.calories}/{activityData.goal} <span className="unit">KCAL</span></p></div>
                                <div className="stat-item"><h4>Steps</h4><p>{activityData.steps}</p></div>
                                <div className="stat-item"><h4>Distance</h4><p>{(activityData.distance || 0).toFixed(2)} <span className="unit">KM</span></p></div>
                            </div>
                        </div>
                    </div>

                    {/* --- SYNCING TILE (Fills the Desktop Gap) --- */}
                    <div className="card sync-card">
                        <div className="sync-header">
                            <div className="sync-dot green"></div>
                            <h3>{t('Syncing') || 'Syncing'}</h3>
                        </div>
                        <p>
                            Synced with Google Fitness {lastSyncedAgo ? lastSyncedAgo : 'just now'}
                        </p>
                    </div>

                    {/* Goals Completed */}
                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('Goals Completed')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-progress-bar">
                            <div className="progress-fill" style={{width: '75%'}}></div>
                            <img alt="Tomato" width="100%" src={tomato} className="progress-tomato"  />
                            <span className="progress-text">3/4</span>
                        </div>
                        <div className="goals-detailed-grid">
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot"></div> Daily Steps</div>
                                <p>Walk 5,000 steps per day</p>
                            </div>
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Exercise</div>
                                <p>1 hour per day</p>
                            </div>
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Sleep</div>
                                <p>7 hours per day</p>
                            </div>
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Water</div>
                                <p>2 Liters</p>
                            </div>
                        </div>
                    </div>

                    {/* Small Tiles */}
                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('Blood Pressure')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">120/80 <span>mmHg</span></div>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('Heart Rate')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('Health Score')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-ring-wrapper">
                            <div className="score-ring"><div className="score-inner">87%</div></div>
                        </div>
                    </div>

                    <div className="card awards-card" onClick={() => navigate('/awards')}>
                        <div className="card-header"><h3>{t('Awards')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="awards-content">
                            <img src={awards} alt="Award" className="award-badge" />
                            <div className="progress-bar-simple"><div className="fill"></div></div>
                        </div>
                    </div>
                </div>
                {/* --- MAIN GRID END --- */}

                {/* --- BOTTOM SECTIONS --- */}
                <div className="recommendations-section">
                    <h3>{t('recommendations') || "Recommendations"}</h3>
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
                    <div className="section-header-row">
                        <h3>{t('nearby_care') || "Find Nearby Care"}</h3>
                        <button onClick={handleGetLocation} className="loc-btn">
                             <FiNavigation /> {locationLoading ? t('locating') : t('use_my_location') || "Use My Location"}
                        </button>
                    </div>

                    {clinics.length === 0 && !locationLoading && (
                        <div className="empty-clinics-state"><p>{t('location_prompt') || 'Click "Use My Location" to see clinics near you.'}</p></div>
                    )}

                    <div className="clinics-grid-container">
                        {clinics.map((clinic) => (
                            <div key={clinic.id} className="clinic-tile" onClick={() => openGoogleMaps(clinic.name, clinic.fullAddress)}>
                                <div className="clinic-tile-header">
                                    <div className={`clinic-status-badge ${clinic.isOpen ? 'open' : 'closed'}`}>{clinic.status}</div>
                                    <span className="clinic-distance">{clinic.distance} km</span>
                                </div>
                                <h4 className="clinic-name">{clinic.name}</h4>
                                <div className="clinic-tile-footer">
                                    <span className="clinic-view-details">{t('view_details') || "View Details"}</span>
                                    <FiExternalLink size={16} color="var(--text-secondary)" />
                                </div>
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