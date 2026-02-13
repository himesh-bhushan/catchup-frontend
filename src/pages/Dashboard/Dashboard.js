import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { t } = useTranslation();
  
  // --- STATE ---
  const [firstName, setFirstName] = useState(localStorage.getItem('userName') || "Friend");
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null); // ✅ NEW: Avatar State
  
  // Activity Ring Data (Linked to DB)
  const [activityData, setActivityData] = useState({
    calories: 0,
    steps: 0,
    distance: 0,
    goal: 500, 
    percentage: 0
  });

  // Other Stats (Heart Rate Linked to DB)
  const [otherStats, setOtherStats] = useState({
    heart_rate: 72, // Default if no data
    sleep: 28800 // 8 hours in seconds (Placeholder)
  });

  const [loading, setLoading] = useState(true);
  const [isDeviceConnected, setIsDeviceConnected] = useState(localStorage.getItem('deviceConnected') === 'true');
  const [connecting, setConnecting] = useState(false); 
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  
  // Location / Clinics
  const [clinics, setClinics] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

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

  // ✅ NEW: Download Image Helper
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
    { id: 4, title: t('rec_water') || "Hydration Hacks for Daily Life", img: tomato, color: "#e0f7fa" },
    { id: 5, title: t('rec_bp') || "Understanding Your Blood Pressure", img: heartVisual, color: "#f3e5f5" },
    { id: 6, title: t('rec_move') || "The Science of Daily Movement", img: tomatoHero, color: "#e8f5e9" },
  ];

  // --- MAIN DATA FETCH (Supabase Linked) ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        setUser(session.user);

        try {
            // 1. Fetch Profile (Name, Goal, Avatar)
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, calorie_goal, avatar_url') // ✅ Fetch avatar_url
                .eq('id', session.user.id)
                .single();
            
            let currentGoal = 500;
            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.calorie_goal) currentGoal = profile.calorie_goal;
                if (profile.avatar_url) downloadImage(profile.avatar_url); // ✅ Download avatar
            }

            // 2. Fetch TODAY'S Activity from DB
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayLog } = await supabase
                .from('activity_logs')
                .select('calories, steps, distance')
                .eq('user_id', session.user.id)
                .eq('date', todayStr)
                .single();

            // 3. Process Activity Data
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

            // 4. Fetch Latest Heart Rate
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

  // --- INITIAL EFFECT ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
             {/* ✅ Updated Mobile Avatar Click Area */}
             <div className="mobile-avatar" onClick={() => navigate('/profile')}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="User" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                ) : (
                    <FiUser />
                )}
             </div>
             <button className="refresh-btn" onClick={fetchDashboardData}><FiRefreshCw /></button>
          </div>
          <div className="header-flex">
            <div>
                <h1 className="desktop-title">{t('welcome_message', { name: firstName })}</h1>
                <h1 className="mobile-title">{t('welcome_message', { name: firstName })}</h1>
            </div>
            <div className="desktop-title"><button className="refresh-btn" onClick={fetchDashboardData}><FiRefreshCw /></button></div>
          </div>
        </header>

        {loading ? (
            <div className="big-tile-container animate-fade-in">
                <div className="big-connect-card">
                    <div className="icon-pulse"><img alt="Tomato" width="80%" src={tomato} /></div>
                    <h3>{t('loading_data') || "Loading your wellness data..."}</h3>
                </div>
            </div>
        ) : !isDeviceConnected ? ( 
            <div className="big-tile-container animate-fade-in">
                <div className="big-connect-card" style={{ minHeight: '450px', justifyContent: 'center' }}>
                    {showConnectMenu ? (
                        <div className="fade-in-up connect-device-card-content">
                            <div className="connect-title-row">
                                <button onClick={() => setShowConnectMenu(false)} className="back-btn"><FiArrowLeft size={24} /></button>
                                <h3 className="connect-device-title">Select Device</h3>
                            </div>
                            <p className="connect-subtitle">Choose a tracker to sync your health data.</p>
                            <div className="device-btn-container">
                                <button onClick={() => handleConnectProvider()} className="device-connect-btn fitbit" disabled={connecting}><div className="device-label"><FiBluetooth size={20} /><span>Connect Fitbit</span></div>{connecting && <FiRefreshCw className="icon-spin" />}</button>
                                <button onClick={() => handleConnectProvider()} className="device-connect-btn garmin" disabled={connecting}><div className="device-label"><FiBluetooth size={20} /><span>Connect Garmin</span></div></button>
                                <button onClick={() => handleConnectProvider()} className="device-connect-btn oura" disabled={connecting}><div className="device-label"><FiBluetooth size={20} /><span>Connect Oura</span></div></button>
                                <button onClick={() => handleConnectProvider()} className="device-connect-btn whoop" disabled={connecting}><div className="device-label"><FiBluetooth size={20} /><span>Connect Whoop</span></div></button>
                            </div>
                            <img src={tomatoHero} alt="Tomato with watch" className="device-illustration" />
                            <p className="device-connect-footer">Powered by Open Wearables</p>
                        </div>
                    ) : (
                        <>
                            <div className="icon-pulse"><FiWatch size={60} color="#00796b"/></div>
                            <h2>{t('connect_title') || "Let's Get Connected"}</h2>
                            <p>{t('connect_desc') || "Connect your wearable device to unlock your personal health dashboard."}</p>
                            <button className="connect-btn" onClick={() => setShowConnectMenu(true)}>{t('connect_btn') || "Connect Tracker"}</button>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="dash-grid">
                    
                    {/* ✅ ACTIVITY RING CARD (Linked to DB) */}
                    <div className="card activity-card" onClick={() => navigate('/activity')}>
                        <div className="card-header"><h3>{t('activity_ring') || "Activity Ring"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="activity-content">
                        <div className="ring-wrapper">
                            <div className="activity-ring" 
                                style={{ 
                                    background: `conic-gradient(
                                        #FF5252 0% ${activityData.percentage}%, 
                                        #E0E0E0 0% 100%
                                    )` 
                                }}>
                                <div className="inner-circle">
                                    <img alt="Tomato" width="60%" src={tomato} />
                                    <span>{Math.round(activityData.percentage)}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="activity-stats">
                            <div className="stat-item"><h4>{t('move') || "Move"}</h4><p>{activityData.calories}/{activityData.goal} <span className="unit">KCAL</span></p></div>
                            <div className="stat-item"><h4>{t('step_count') || "Step Count"}</h4><p>{activityData.steps}</p></div>
                            <div className="stat-item"><h4>{t('distance') || "Distance"}</h4><p>{(activityData.distance || 0).toFixed(2)} <span className="unit">KM</span></p></div>
                        </div>
                        </div>
                    </div>

                    {/* ✅ GOALS CARD (Linked to /goals) */}
                    <div className="card goals-card" onClick={() => navigate('/goals')}>
                        <div className="card-header"><h3>{t('goals_completed') || "Goals Completed"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="goals-progress-bar">
                            <div className="progress-fill" style={{width: '75%'}}></div>
                            <img alt="Tomato" width="100%" src={tomato} className="progress-tomato"  />
                            <span className="progress-text">3/4</span>
                        </div>
                        <div className="goals-grid">
                            <div className="goal-item"><div className="dot green"></div><div><h5>{t('steps') || "Steps"}</h5><p>{activityData.steps}</p></div></div>
                            <div className="goal-item"><div className="dot green"></div><div><h5>{t('exercise') || "Exercise"}</h5><p>--</p></div></div>
                            <div className="goal-item"><div className="dot green"></div><div><h5>{t('sleep') || "Sleep"}</h5><p>{(otherStats.sleep/3600).toFixed(1)}h</p></div></div>
                            <div className="goal-item"><div className="dot green"></div><div><h5>{t('water') || "Water"}</h5><p>2L</p></div></div>
                        </div>
                    </div>

                    {/* ✅ BP CARD (Linked to /blood-pressure) */}
                    <div className="card bp-card" onClick={() => navigate('/blood-pressure')}>
                        <div className="card-header"><h3>{t('blood_pressure') || "Blood Pressure"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="bp-value">120/80 <span>mmHg</span></div>
                    </div>

                    {/* HEALTH SCORE CARD */}
                    <div className="card score-card" onClick={() => navigate('/health-score')}>
                        <div className="card-header"><h3>{t('health_score') || "Health Score"}</h3><FiChevronRight className="card-arrow" /></div>
                        <div className="score-big">87 <span>SCORE</span></div>
                        <div className="score-details-grid">
                            <div className="score-mini-box red"><FiHeart /><span>{t('heart')||"Heart"}</span><strong>{otherStats.heart_rate}</strong></div>
                            <div className="score-mini-box orange"><FiMoon /><span>{t('sleep')||"Sleep"}</span><strong>{(otherStats.sleep/3600).toFixed(0)}h</strong></div>
                            <div className="score-mini-box yellow"><FiActivity /><span>Cal</span><strong>{activityData.calories}</strong></div>
                            <div className="score-mini-box blue"><FiDroplet /><span>{t('water')||"Water"}</span><strong>2 L</strong></div>
                        </div>
                    </div>

                    {/* HEART CARD - Linked to DB Data */}
                    <div className="card heart-card" onClick={() => navigate('/heart-rate')}>
                        <div className="card-header"><h3>{t('heart_rate') || "Heart Rate"}</h3><FiHeart className="card-icon-red" /><FiChevronRight className="card-arrow" /></div>
                        <div className="heart-visuals" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <img alt="Heart Rate" width="80%" src={heartVisual} /></div>
                        <div className="heart-value">{otherStats.heart_rate} <span>BPM</span></div>
                    </div>

                    <div className="card fight-card">
                        <div className="speech-bubble">{t('fight_msg') || "Fight For Yourself"}</div>
                        <img src={tomatoHero} alt="Fit Tomato" className="fight-tomato" />
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
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                        <h3>{t('nearby_care') || "Find Nearby Care"}</h3>
                        <button onClick={handleGetLocation} style={{
                                backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none', padding: '10px 20px', borderRadius: '30px',
                                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                             <FiNavigation /> {locationLoading ? t('locating') : t('use_my_location')}
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
                                    <div className={`clinic-status-badge ${clinic.isOpen ? 'open' : 'closed'}`}>
                                        {clinic.status}
                                    </div>
                                    <span className="clinic-distance">{clinic.distance} km</span>
                                </div>
                                
                                <h4 className="clinic-name">{clinic.name}</h4>
                                
                                <div className="clinic-tile-footer">
                                    <div className="clinic-phone">
                                    <span className="clinic-view-details">{t('view_details') || "View Details"}</span>
                                    </div>
                                    <FiExternalLink size={16} color="var(--text-secondary)" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
         )
        }
      </div>
    </div>
  );
};

export default Dashboard;