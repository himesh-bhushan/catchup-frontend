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
  const [isAwardEarned, setIsAwardEarned] = useState(false);
  
  const [lastSynced, setLastSynced] = useState(null); 
  const [lastSyncedAgo, setLastSyncedAgo] = useState(null);
  
  const [activityData, setActivityData] = useState({
    calories: 0, steps: 0, distance: 0, goal: 500, percentage: 0
  });

  const [otherStats, setOtherStats] = useState({
    heart_rate: 0, 
    sleep: 0,
    water_intake: 0,
    blood_pressure: "--/--"
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
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
    const searchQuery = encodeURIComponent(`${name} ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
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
                .select('first_name, calorie_goal, avatar_url, google_connected, last_synced_at, heart_rate, sleep_seconds, water_intake, blood_pressure')
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
                    setLastSyncedAgo(calculateTimeAgo(profile.last_synced_at));
                }

                setOtherStats({
                    heart_rate: profile.heart_rate || 0,
                    sleep: profile.sleep_seconds || 0, 
                    water_intake: profile.water_intake || 0,
                    blood_pressure: profile.blood_pressure || "--/--"
                });
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayLog } = await supabase.from('activity_logs').select('*').eq('user_id', session.user.id).eq('date', todayStr).maybeSingle();
            
            const goal = profile?.calorie_goal || 500;
            const cals = todayLog?.calories || 0;
            const dailyGoalMet = goal > 0 && cals >= goal;
            setIsAwardEarned(dailyGoalMet);

            setActivityData({
                calories: cals, steps: todayLog?.steps || 0, distance: todayLog?.distance || 0, goal: goal,
                percentage: goal > 0 ? Math.min((cals / goal) * 100, 100) : 0
            });

        } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ==========================================
  // 🩺 HEALTH SCORE CALCULATIONS (FOR DASHBOARD PREVIEW)
  // ==========================================
  const heart = otherStats.heart_rate || 0;
  const sleep = otherStats.sleep || 0;
  const cals = activityData.calories || 0;
  const water = otherStats.water_intake || 0;

  let hrScore = 0;
  if (heart > 0) {
    if (heart >= 60 && heart <= 80) hrScore = 100;
    else if (heart > 80 && heart <= 100) hrScore = Math.max(0, 100 - (heart - 80) * 2);
    else if (heart > 100) hrScore = Math.max(0, 60 - (heart - 100) * 3);
    else if (heart < 60) hrScore = Math.max(0, 100 - (60 - heart) * 2);
  }

  let sleepScore = 0;
  const sleepHrs = sleep / 3600;
  if (sleepHrs > 0) {
    if (sleepHrs >= 7 && sleepHrs <= 9) sleepScore = 100;
    else sleepScore = Math.max(0, 100 - Math.abs(sleepHrs - 8) * 15);
  }

  let calScore = 0;
  if (cals > 0) calScore = Math.min(100, (cals / 500) * 100);

  let waterScore = 0;
  if (water > 0) {
    const waterLiters = water / 1000; 
    waterScore = Math.min(100, (waterLiters / 2.5) * 100);
  }

  const hrContrib = hrScore * 0.35;
  const sleepContrib = sleepScore * 0.25;
  const calContrib = calScore * 0.25;
  const waterContrib = waterScore * 0.15;
  
  const totalScore = Math.round(hrContrib + sleepContrib + calContrib + waterContrib);

  // SVG Configuration
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 14;

  const totalAchieved = hrContrib + sleepContrib + calContrib + waterContrib;
  const safeTotal = totalAchieved > 0 ? totalAchieved : 1; 

  const hrLen = (hrContrib / safeTotal) * circumference;
  const sleepLen = (sleepContrib / safeTotal) * circumference;
  const calLen = (calContrib / safeTotal) * circumference;
  const waterLen = (waterContrib / safeTotal) * circumference;

  const hrOffset = 0;
  const sleepOffset = hrLen;
  const calOffset = hrLen + sleepLen;
  const waterOffset = hrLen + sleepLen + calLen;

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
                
                <div className="dash-grid">
                    
                    {/* Activity Ring */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('Activity Ring')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                            <div className="ring-wrapper">
                                <div className="activity-ring" style={{ background: `conic-gradient(#FF5252 0% ${activityData.percentage}%, #E0E0E0 0% 100%)` }}>
                                    <div className="inner-circle">
                                        <img alt="Tomato" src={tomato} width="40" />
                                        <span>{Math.round(activityData.percentage)}%</span>
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

                    {/* PERFECTLY ALIGNED 3-COLUMN TRIO ROW */}
                    <div className="trio-row-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        
                        <div className="card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="sync-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <div className="sync-dot green" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4CAF50', marginRight: '8px' }}></div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #333)' }}>{t('Syncing') || 'Syncing'}</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
                                Synced {lastSyncedAgo ? lastSyncedAgo : 'just now'}
                            </p>
                        </div>

                        <div className="card" onClick={() => navigate('/water')} style={{ margin: 0, padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #333)' }}>{t('Water')}</h3>
                                <FiChevronRight className="card-arrow" color="var(--text-secondary, #999)" />
                            </div>
                            <div className="tile-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary, #333)' }}>
                                {otherStats.water_intake > 0 ? (otherStats.water_intake / 1000).toFixed(1) : '0.0'} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary, #666)' }}>L</span>
                            </div>
                        </div>

                        <div className="card" onClick={() => navigate('/sleep')} style={{ margin: 0, padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary, #333)' }}>{t('Sleep')}</h3>
                                <FiChevronRight className="card-arrow" color="var(--text-secondary, #999)" />
                            </div>
                            <div className="tile-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary, #333)' }}>
                                {otherStats.sleep > 0 ? (otherStats.sleep / 3600).toFixed(1) : '0.0'} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary, #666)' }}>hrs</span>
                            </div>
                        </div>

                    </div>

                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('Goals Completed')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-progress-bar">
                            <div className="progress-fill" style={{width: '75%'}}></div>
                            <img alt="Tomato" width="100%" src={tomato} className="progress-tomato"  />
                            <span className="progress-text">3/4</span>
                        </div>
                        <div className="goals-detailed-grid">
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Daily Steps</div>
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

                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('Blood Pressure')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">{otherStats.blood_pressure} <span>mmHg</span></div>
                    </div>

                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('Heart Rate')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    {/* Health Score Section */}
                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header score-header-nudged">
                            <h3>{t('Health Score') || "Health Score"}</h3>
                            <FiChevronRight className="card-arrow" />
                        </div>
                        
                        <div className="health-score-content">
                            <div className="score-ring-wrapper" style={{ position: 'relative' }}>
                                <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth={strokeWidth} />
                                  {hrContrib > 0 && (
                                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#EF473A" strokeWidth={strokeWidth}
                                      strokeDasharray={`${hrLen} ${circumference}`} strokeDashoffset={-hrOffset} transform="rotate(-90 50 50)" />
                                  )}
                                  {sleepContrib > 0 && (
                                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F7931E" strokeWidth={strokeWidth}
                                      strokeDasharray={`${sleepLen} ${circumference}`} strokeDashoffset={-sleepOffset} transform="rotate(-90 50 50)" />
                                  )}
                                  {calContrib > 0 && (
                                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#FDE08B" strokeWidth={strokeWidth}
                                      strokeDasharray={`${calLen} ${circumference}`} strokeDashoffset={-calOffset} transform="rotate(-90 50 50)" />
                                  )}
                                  {waterContrib > 0 && (
                                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#4A90E2" strokeWidth={strokeWidth}
                                      strokeDasharray={`${waterLen} ${circumference}`} strokeDashoffset={-waterOffset} transform="rotate(-90 50 50)" />
                                  )}
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ color: '#DE4B4E', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalScore}</span>
                                </div>
                            </div>

                            <div className="score-metrics-list">
                                <div className="metric-pill pill-red">
                                    <div className="metric-icon-circle"><FiHeart color="#EF473A" /></div>
                                    <div className="metric-text-group">
                                        <span className="metric-label">Heart Rate</span>
                                        <span className="metric-value">{otherStats.heart_rate} <strong>BPM</strong></span>
                                    </div>
                                </div>
                                
                                <div className="metric-pill pill-orange" onClick={() => navigate('/sleep')}>
                                    <div className="metric-icon-circle"><FiMoon color="#F7931E" /></div>
                                    <div className="metric-text-group">
                                        <span className="metric-label">Sleep Hours</span>
                                        <span className="metric-value">
                                            {otherStats.sleep > 0 
                                                ? (otherStats.sleep / 3600).toFixed(1) 
                                                : '0.0'} <strong>hours</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="metric-pill pill-yellow">
                                    <div className="metric-icon-circle"><FiActivity color="#333" /></div>
                                    <div className="metric-text-group">
                                        <span className="metric-label">Calories Burned</span>
                                        <span className="metric-value">{activityData.calories} <strong>KCAL</strong></span>
                                    </div>
                                </div>

                                <div className="metric-pill pill-blue" onClick={() => navigate('/water')}>
                                    <div className="metric-icon-circle"><FiDroplet color="#4A90E2" /></div>
                                    <div className="metric-text-group">
                                        <span className="metric-label">Water Intake</span>
                                        <span className="metric-value">
                                            {otherStats.water_intake > 0 
                                                ? (otherStats.water_intake / 1000).toFixed(1) 
                                                : '0.0'} <strong>L</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card awards-card" onClick={() => navigate('/awards')}>
                        <div className="card-header"><h3>{t('Awards')}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="awards-content">
                            <img 
                                src={awards} 
                                alt="Award Badge" 
                                className={`award-badge-status ${isAwardEarned ? 'earned-color' : 'not-earned-gray'}`} 
                            />
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
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

                {/* Nearby Care */}
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