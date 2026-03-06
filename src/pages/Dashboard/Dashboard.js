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
  const [lastSynced, setLastSynced] = useState(null); 
  
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

  // --- CLINIC / LOCATION LOGIC ---
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
      window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  // --- BLOG DATA ---
  const recommendations = [
    { id: 1, title: t('rec_tomatoes') || "The Health Benefits of Eating Tomatoes", img: tomato, color: "#fff3e0" },
    { id: 2, title: t('rec_heart') || "5 Simple Steps to Better Heart Health", img: heartVisual, color: "#ffebee" },
    { id: 3, title: t('rec_sleep') || "Why Sleep is Your Superpower", img: tomatoHero, color: "#e3f2fd" },
    { id: 4, title: t('rec_water') || "Hydration Hacks for Daily Life", img: tomato, color: "#e0f7fa" },
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
            
            let currentGoal = 500;
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.calorie_goal) currentGoal = profile.calorie_goal;
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

  return (
    <div className="dashboard-wrapper">
      <DashboardNav />
      <div className="dashboard-content">
        
        {/* --- HEADER --- */}
        <header className="dash-header">
          <div className="mobile-header-top">
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? <img src={avatarUrl} alt="User" className="avatar-img-circle" /> : <FiUser />}
             </div>
             <button className="refresh-btn" onClick={handleRefreshSync}><FiRefreshCw className={loading ? "icon-spin" : ""} /></button>
          </div>
          <div className="header-flex">
            <div className="header-text-group">
                <p className="greeting-small">Hi, {firstName}</p>
                <h1 className="desktop-title">Have a nice day</h1>
                {lastSynced && <p className="last-synced-label" style={{fontSize: '0.85rem', opacity: 0.7, margin: '4px 0 0 0'}}>Last updated: {lastSynced}</p>}
                {lastSynced && <p className="last-synced-label" style={{fontSize: '0.85rem',color: '#000000', opacity: 0.7, margin: '4px 0 0 0'}}>Last updated: {lastSynced}</p>}
                <h1 className="mobile-title">Have a nice day</h1>
            </div>
            <div className="desktop-only-refresh">
                <button className="refresh-btn" onClick={handleRefreshSync}>
                    <FiRefreshCw className={loading ? "icon-spin" : ""} />
                </button>
            </div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container"><div className="big-connect-card"><h3>{t('loading_data') || 'Loading...'}</h3></div></div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container">
                <div className="big-connect-card">
                    {showConnectMenu ? (
                        <div className="connect-device-card-content">
                            <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                            <h3>Select Device</h3>
                            <button onClick={handleGoogleConnect} className="device-connect-btn oura">Connect Oura</button>
                            <button onClick={handleConnectProvider} className="device-connect-btn fitbit">Connect Fitbit</button>
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
                
                {/* --- MAIN DASHBOARD GRID --- */}
                <div className="dash-grid">
                    
                    {/* 1. Syncing Card */}
                    <div className="card sync-card">
                        <div className="sync-header">
                            <div className="sync-dot"></div>
                            <h3>{t('Syncing') || 'Syncing'}</h3>
                        </div>
                        <p>Synced with Apple Health & Google Fitness {lastSynced ? `at ${lastSynced}` : 'just now'}</p>
                    </div>

                    {/* 2. Activity Ring */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('Activity Ring') || 'Activity Ring'}</h3><FiChevronRight className="card-arrow" /></div>
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
                                <div className="stat-item"><h4>Step Count</h4><p>{activityData.steps}</p></div>
                                <div className="stat-item"><h4>Distance</h4><p>{(activityData.distance || 0).toFixed(2)} <span className="unit">KM</span></p></div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Goals Completed */}
                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('Goals Completed') || 'Goals Completed'}</h3><FiChevronRight className="card-arrow" /></div>
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
                                <p>Go exercise one hour per day</p>
                            </div>
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Sleep Duration</div>
                                <p>Sleep at least 7 hours per day</p>
                            </div>
                            <div className="goal-item-detailed">
                                <div className="goal-item-header"><div className="goal-dot filled"></div> Water Intake</div>
                                <p>Drink 2 Litre of water</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Blood Pressure */}
                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('Blood Pressure') || 'Blood Pressure'}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">120/80 <span>mmHg</span></div>
                    </div>

                    {/* 5. Heart Rate */}
                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('Heart Rate') || 'Heart Rate'}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="tile-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    {/* 6. Health Score */}
                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('Health Score') || 'Health Score'}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-ring-wrapper">
                            <div className="score-ring">
                                <div className="score-inner">87%</div>
                            </div>
                        </div>
                    </div>

                    {/* 7. Awards */}
                    <div className="card awards-card" onClick={() => navigate('/awards')}>
                        <div className="card-header"><h3>{t('Awards') || 'Awards'}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="awards-content">
                            <img src={awards} alt="Award" className="award-badge" />
                            <div className="progress-bar-simple"><div className="fill"></div></div>
                        </div>
                    </div>
                </div>

                {/* --- BOTTOM SECTION: RECOMMENDATIONS --- */}
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

                {/* --- LOCATION SECTION --- */}
                <div className="recommendations-section">
                    <div className="section-header-row">
                        <h3>{t('nearby_care') || "Find Nearby Care"}</h3>
                        <button onClick={handleGetLocation} className="loc-btn">
                            <FiNavigation /> {locationLoading ? t('locating') : t('use_my_location') || "Use My Location"}
                        </button>
                    </div>

                    {clinics.length === 0 && !locationLoading && (
                        <div className="empty-clinics-state">
                            <p>{t('location_prompt') || 'Click "Use My Location" to see clinics near you.'}</p>
                        </div>
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