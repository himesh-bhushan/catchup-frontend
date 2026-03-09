import React, { useState, useEffect } from 'react';
import { 
  FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, 
  FiUserPlus, FiCheck, FiTrash2, FiHeart, FiMoon, FiActivity, FiDroplet, FiChevronRight, FiShare2 
} from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';

// Asset Imports
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';
import awards from '../../assets/awards.png'; // Make sure you have this image in your assets folder

import './Sharing.css';

const Sharing = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Friend Detail States
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendStats, setFriendStats] = useState(null);
  const [friendWeeklyData, setFriendWeeklyData] = useState([]);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('has_onboarded_sharing');
    if (hasOnboarded === 'true') {
      setShowLeaderboard(true);
    }
    fetchIncomingRequests();
    fetchFriends();
  }, []);

  // --- SCORE CALCULATION LOGIC ---
  const calculateUserScore = (profile, activity) => {
    let hrScore = 0, sleepScore = 0, calScore = 0, waterScore = 0;
    
    const heart = profile?.heart_rate || 0;
    if (heart > 0) {
      if (heart >= 60 && heart <= 80) hrScore = 100;
      else hrScore = Math.max(0, 100 - Math.abs(heart - 70) * 2);
    }

    const sleepHrs = (profile?.sleep_seconds || 0) / 3600;
    if (sleepHrs > 0) sleepScore = Math.max(0, 100 - Math.abs(sleepHrs - 8) * 15);
    
    const cals = activity?.calories || 0;
    const goal = profile?.calorie_goal || 500;
    calScore = Math.min(100, (cals / goal) * 100);
    
    const waterLiters = (profile?.water_intake || 0) / 1000;
    waterScore = Math.min(100, (waterLiters / 2.5) * 100);

    return Math.round(hrScore * 0.35 + sleepScore * 0.25 + calScore * 0.25 + waterScore * 0.15);
  };

  // --- DATABASE FETCHING ---
  const fetchIncomingRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('friend_requests')
      .select('id, sender_id, profiles:sender_id (first_name, last_name, avatar_url)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (data) setIncomingRequests(data);
  };

  const fetchFriends = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);

    if (!error && data) {
      const friendIds = data.map(rel => rel.sender_id === authUser.id ? rel.receiver_id : rel.sender_id);
      const allIds = [...new Set([authUser.id, ...friendIds])];

      const { data: profiles } = await supabase.from('profiles').select('*').in('id', allIds);
      const { data: activities } = await supabase.from('activity_logs').select('*').in('user_id', allIds).eq('date', todayStr);

      const networkWithScores = profiles.map(profile => {
        const activity = activities?.find(a => a.user_id === profile.id);
        return {
          ...profile,
          isMe: profile.id === authUser.id,
          score: calculateUserScore(profile, activity)
        };
      });

      setMyFriends(networkWithScores.sort((a, b) => b.score - a.score));
      if (networkWithScores.length > 1) localStorage.setItem('has_onboarded_sharing', 'true');
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  const handleViewFriend = async (friend) => {
    setViewingFriend(friend);
    setFriendLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 6);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', friend.id).single();
      const { data: activity } = await supabase.from('activity_logs').select('*').eq('user_id', friend.id).eq('date', todayStr).maybeSingle();
      const { data: earnedAwards } = await supabase.from('user_awards').select('*').eq('user_id', friend.id);
      const { data: weeklyLogs } = await supabase
        .from('activity_logs')
        .select('date, calories')
        .eq('user_id', friend.id)
        .gte('date', lastWeekStr)
        .order('date', { ascending: true });

      const score = calculateUserScore(profile, activity);
      const goal = profile?.calorie_goal > 0 ? profile.calorie_goal : 500;
      const movePct = ((activity?.calories || 0) / goal) * 100;

      // Process Weekly Data for Bar Chart
      const last7Days = getLast7Days();
      const processedWeekly = last7Days.map(day => {
        const log = (weeklyLogs || []).find(l => l.date === day.dateStr);
        const cal = log?.calories || 0;
        const pct = Math.min((cal / goal) * 100, 100);
        return { dayName: day.dayName, percent: pct };
      });

      setFriendWeeklyData(processedWeekly);
      setFriendStats({
        profile,
        activity,
        healthScore: score,
        movePercent: Math.min(movePct, 100),
        awards: earnedAwards || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  };

  // --- UI ACTIONS ---
  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('friend_requests').insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);
    setSentRequests(prev => [...prev, receiverId]);
  };

  const updateRequestStatus = async (id, status) => {
    await supabase.from('friend_requests').update({ status }).eq('id', id);
    fetchIncomingRequests();
    fetchFriends();
  };

  const handleRemoveFriend = async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!window.confirm("Remove this friend and stop data sharing?")) return;
    await supabase.from('friend_requests').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);
    fetchFriends();
  };

  const handleShare = () => {
    alert("Award Shared!");
  };

  // --- SEARCH EFFECT ---
  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim().length < 2) { setSearchResults([]); return; }
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`).limit(5);
      if (data) setSearchResults(data);
    };
    const delaySearch = setTimeout(search, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const isAwardEarned = friendStats?.awards?.length > 0;

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">

          {viewingFriend ? (
            /* --- 1. FRIEND DETAIL DASHBOARD --- */
            <div className="friend-detail-dashboard">
              <header className="detail-header-new">
                <button className="back-circle-btn" onClick={() => setViewingFriend(null)}>
                  <FiArrowLeft size={24} />
                </button>
                <div className="header-user-profile">
                  <div className="profile-image-ring">
                    {viewingFriend.avatar_url ? <img src={viewingFriend.avatar_url} alt="" /> : <FiUser />}
                  </div>
                  <div className="profile-text">
                    <h1 className="black-name-title">{viewingFriend.first_name} {viewingFriend.last_name}</h1>
                    <span className="health-score-pill">Health Score: {friendStats?.healthScore}</span>
                  </div>
                </div>
              </header>

              {friendLoading ? (
                <div className="lb-placeholder-text">Syncing Health Data...</div>
              ) : (
                <div className="dashboard-grid-layout">
                  
                  {/* --- TOP ROW: ACTIVITY RING & HEALTH SCORE --- */}
                  <div className="activity-main-row">
                    
                    {/* Activity Ring (Vertically and Horizontally Centered) */}
                    <div className="glass-card dash-style-card activity-card-centered">
                      <div className="dash-card-header">
                        <h3>Daily Activity</h3>
                        <FiChevronRight color="#E64A45" />
                      </div>
                      <div className="dash-card-body activity-body-centered">
                        <div className="dash-ring-wrapper-huge">
                          <svg viewBox="0 0 100 100">
                            <circle className="dash-bg-ring" cx="50" cy="50" r="38" />
                            <circle 
                              className="dash-meter-ring" 
                              cx="50" cy="50" r="38" 
                              style={{ strokeDasharray: `${(friendStats?.movePercent * 2.38)}, 238` }}
                            />
                          </svg>
                          <div className="dash-ring-inner-centered">
                            <span className="inner-percent-large">{Math.round(friendStats?.movePercent)}%</span>
                            <span className="inner-label-small">of goal</span>
                          </div>
                        </div>
                        <div className="dash-stats-row">
                          <div className="stat-box">
                            <span className="stat-box-val">{friendStats?.healthScore || 0}</span>
                            <span className="stat-box-lbl">VITALITY</span>
                          </div>
                          <div className="stat-box">
                            <span className="stat-box-val">{friendStats?.activity?.calories || 0}</span>
                            <span className="stat-box-lbl">KCAL</span>
                          </div>
                          <div className="stat-box">
                            <span className="stat-box-val">{friendStats?.activity?.steps || 0}</span>
                            <span className="stat-box-lbl">STEPS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Health Score */}
                    <div className="glass-card dash-style-card">
                      <div className="dash-card-header">
                        <h3>Health Score</h3>
                        <FiChevronRight color="#E64A45" />
                      </div>
                      <div className="dash-card-body hs-body">
                        <div className="dash-ring-wrapper-medium">
                          {/* 4-Color Segmented Ring */}
                          <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="35" stroke="#D3504A" strokeWidth="16" fill="none" strokeDasharray="75 220" strokeDashoffset="0" />
                            <circle cx="50" cy="50" r="35" stroke="#E29E3A" strokeWidth="16" fill="none" strokeDasharray="60 220" strokeDashoffset="-75" />
                            <circle cx="50" cy="50" r="35" stroke="#F6E27F" strokeWidth="16" fill="none" strokeDasharray="15 220" strokeDashoffset="-135" />
                            <circle cx="50" cy="50" r="35" stroke="#5C83D6" strokeWidth="16" fill="none" strokeDasharray="70 220" strokeDashoffset="-150" />
                          </svg>
                          <div className="dash-ring-inner HS-INNER-CIRCLE">
                            <span className="hs-center-val">{friendStats?.healthScore || 0}</span>
                          </div>
                        </div>
                        <div className="hs-pills-list">
                          <div className="hs-pill bg-red hs-thinner-pill">
                            <div className="pill-icon-wrapper-small HS-SMALL-ICON-BOX"><FiHeart className="icon-red hs-icon-scale" /></div>
                            <div className="pill-text hs-smaller-text"><span>Heart Rate</span><strong>{friendStats?.profile?.heart_rate || '--'} <small>BPM</small></strong></div>
                          </div>
                          <div className="hs-pill bg-orange hs-thinner-pill">
                            <div className="pill-icon-wrapper-small HS-SMALL-ICON-BOX"><FiMoon className="icon-orange hs-icon-scale" /></div>
                            <div className="pill-text hs-smaller-text"><span>Sleep Hours</span><strong>{(friendStats?.profile?.sleep_seconds / 3600).toFixed(1) || '0'} <small>HOURS</small></strong></div>
                          </div>
                          <div className="hs-pill bg-yellow hs-thinner-pill">
                            <div className="pill-icon-wrapper-small HS-SMALL-ICON-BOX"><FiActivity className="icon-dark hs-icon-scale" /></div>
                            <div className="pill-text dark-text hs-smaller-text"><span>Calories Burned</span><strong>{friendStats?.activity?.calories || 0} <small>KCAL</small></strong></div>
                          </div>
                          <div className="hs-pill bg-blue hs-thinner-pill">
                            <div className="pill-icon-wrapper-small HS-SMALL-ICON-BOX"><FiDroplet className="icon-blue hs-icon-scale" /></div>
                            <div className="pill-text hs-smaller-text"><span>Water Intake</span><strong>{(friendStats?.profile?.water_intake / 1000).toFixed(1) || '0'} <small>L</small></strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- BOTTOM ROW: WEEKLY PERFORMANCE & SINGLE AWARD --- */}
                  <div className="awards-weekly-row">
                    
                    {/* Weekly Performance Bar Chart */}
                    <div className="glass-card weekly-chart-card">
                      <div className="dash-card-header"><h3>Weekly Performance</h3></div>
                      <div className="weekly-bar-chart">
                        {friendWeeklyData.map((day, i) => (
                          <div key={i} className="bar-col">
                            <div className="bar-track">
                              <div className="bar-fill" style={{ height: `${day.percent}%` }}></div>
                            </div>
                            <span className="bar-day-lbl">{day.dayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dashboard Provided Award Code Snippet */}
                    <div className="glass-card awards-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="dash-card-header">
                            <h3>Awards</h3>
                            <FiChevronRight className="card-arrow" color="#E64A45" />
                        </div>
                        <div className="awards-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0' }}>
                            <img 
                                src={awards} 
                                alt="Award Badge" 
                                className={`award-badge-status ${isAwardEarned ? 'earned-color' : 'not-earned-gray'}`} 
                            />
                            
                            {isAwardEarned && (
                                <button 
                                    onClick={handleShare}
                                    style={{
                                        marginTop: '25px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#DE4B4E',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 24px',
                                        borderRadius: '20px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(222, 75, 78, 0.3)',
                                        transition: 'transform 0.2s'
                                    }}>
                                    <FiShare2 size={16} /> Share
                                </button>
                            )}
                        </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : showLeaderboard ? (
            /* --- 2. LEADERBOARD VIEW --- */
            <div className="leaderboard-wrapper">
              <div className="lb-header">
                <button className="lb-transparent-btn" onClick={() => setShowLeaderboard(false)}>
                  <FiArrowLeft size={28} />
                </button>
                <div className="lb-search-bar-alt" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  Find and add friends...
                </div>
                <button className="lb-transparent-btn" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  <FiUserPlus size={28} />
                </button>
              </div>
              
              <div className="lb-podium">
                <div className="podium-col second-place" onClick={() => myFriends[1] && handleViewFriend(myFriends[1])}>
                    <span className="podium-rank">2ND</span>
                    <div className="podium-avatar">{myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : <FiUser size={40} color="#E64A45" />}</div>
                    <span className="podium-score">{myFriends[1]?.score || 0}</span>
                    <span className="podium-name">{myFriends[1] ? `@${myFriends[1].first_name?.toLowerCase()}${myFriends[1].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
                
                <div className="podium-col first-place" onClick={() => myFriends[0] && handleViewFriend(myFriends[0])}>
                    <span className="podium-crown">👑</span>
                    <div className="podium-avatar first-avatar">{myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : <FiUser size={50} color="#E64A45" />}</div>
                    <span className="podium-score first-score">{myFriends[0]?.score || 0}</span>
                    <span className="podium-name">{myFriends[0] ? `@${myFriends[0].first_name?.toLowerCase()}${myFriends[0].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
                
                <div className="podium-col third-place" onClick={() => myFriends[2] && handleViewFriend(myFriends[2])}>
                    <span className="podium-rank">3RD</span>
                    <div className="podium-avatar">{myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : <FiUser size={40} color="#E64A45" />}</div>
                    <span className="podium-score">{myFriends[2]?.score || 0}</span>
                    <span className="podium-name">{myFriends[2] ? `@${myFriends[2].first_name?.toLowerCase()}${myFriends[2].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
              </div>

              <div className="lb-list-alt">
                {myFriends.slice(3).map((f, i) => (
                  <div key={f.id} className="lb-list-card" onClick={() => handleViewFriend(f)}>
                    <div className="lb-card-left">
                      <div className="lb-card-rank">{i + 4}TH</div>
                      <div className="lb-card-avatar">{f.avatar_url ? <img src={f.avatar_url} alt="" /> : <FiUser size={24} />}</div>
                      <span className="lb-card-name">@{f.first_name?.toLowerCase()} {f.isMe && '(You)'}</span>
                    </div>
                    <span className="lb-card-score">{f.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- 3. ONBOARDING / SEARCH VIEW --- */
            <div className="sharing-onboarding-wrapper">
              {!isSearching ? (
                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" alt="" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" alt="" />
                    <img src={avatar3} className="sharing-avatar side-avatar" alt="" />
                  </div>
                  <h1 className="sharing-title">Health Sharing</h1>
                  <p className="sharing-subtitle">Compete with friends and reach your health goals together.</p>
                  <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Get Started</button>
                </>
              ) : (
                <div className="theme-container">
                  <div className="search-header">
                    <h3 className="theme-heading">Find Friends</h3>
                    <FiX size={24} onClick={() => { if(myFriends.length > 1) setShowLeaderboard(true); setIsSearching(false); }} style={{cursor:'pointer'}} />
                  </div>

                  <div className="search-input-wrapper">
                    <input className="theme-search-input" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  {incomingRequests.length > 0 && (
                    <div className="request-group">
                      <h4 className="section-label">Pending Invitations</h4>
                      {incomingRequests.map((req) => (
                        <div key={req.id} className="theme-card highlight-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">{req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="theme-avatar-sm" alt="" /> : <FiUser />}</div>
                            <div className="text-group">
                              <p className="name-bold">{req.profiles?.first_name} {req.profiles?.last_name}</p>
                              <p className="subtext-red">Wants to share progress</p>
                            </div>
                          </div>
                          <div className="action-btns-row">
                            <button className="icon-btn approve" onClick={() => updateRequestStatus(req.id, 'accepted')}><FiCheck /> Approve</button>
                            <button className="icon-btn-delete" onClick={() => updateRequestStatus(req.id, 'declined')}><FiTrash2 /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="results-container">
                    {searchResults.map(u => (
                      <div key={u.id} className="theme-card">
                        <div className="user-info-row">
                          {u.avatar_url ? <img src={u.avatar_url} className="theme-avatar-sm" alt="" /> : <FiUser />}
                          <p className="name-bold">{u.first_name} {u.last_name}</p>
                        </div>
                        <button className={`theme-btn-sm ${sentRequests.includes(u.id) ? 'requested' : ''}`} onClick={() => handleSendRequest(u.id)} disabled={sentRequests.includes(u.id)}>
                          {sentRequests.includes(u.id) ? 'Requested' : 'Invite'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="friends-list-group">
                    <h4 className="section-label">Your Network</h4>
                    <div className="friends-grid">
                      {myFriends.filter(f => !f.isMe).map((friend) => (
                        <div key={friend.id} className="theme-card">
                          <div className="user-info-row">
                            {friend.avatar_url ? <img src={friend.avatar_url} className="theme-avatar-sm" alt="" /> : <FiUser />}
                            <div className="text-group">
                              <p className="name-bold">{friend.first_name}</p>
                              <span className="badge-online">Score: {friend.score}</span>
                            </div>
                          </div>
                          <div className="action-btns-row">
                            <button className="theme-btn-outline" onClick={() => { setIsSearching(false); handleViewFriend(friend); }}>View</button>
                            <button className="icon-btn-delete" onClick={() => handleRemoveFriend(friend.id)}><FiTrash2 /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sharing;