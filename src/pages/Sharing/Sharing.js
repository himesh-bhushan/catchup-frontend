import React, { useState, useEffect } from 'react';
import { 
  FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, 
  FiUserPlus, FiCheck, FiTrash2, FiAward 
} from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';

// Placeholder avatars
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

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

  // --- DATA CALCULATIONS ---

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

  // --- SUPABASE FETCHERS ---

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

    const { data } = await supabase
      .from('friend_requests')
      .select(`sender_id, receiver_id`)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);

    if (data) {
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
    }
  };

  const handleViewFriend = async (friend) => {
    setViewingFriend(friend);
    setFriendLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 6);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      // Fetch Profile, Daily Activity, and Real Earned Awards
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
      const movePercent = profile?.calorie_goal > 0 ? ((activity?.calories || 0) / profile.calorie_goal) * 100 : 0;

      setFriendWeeklyData(weeklyLogs || []);
      setFriendStats({ profile, activity, healthScore: score, movePercent: Math.min(movePercent, 100), awards: earnedAwards || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleSendRequest = async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('friend_requests').insert([{ sender_id: user.id, receiver_id: id, status: 'pending' }]);
    setSentRequests([...sentRequests, id]);
  };

  const updateRequestStatus = async (id, status) => {
    await supabase.from('friend_requests').update({ status }).eq('id', id);
    fetchIncomingRequests();
    fetchFriends();
  };

  // --- SEARCH EFFECT ---
  useEffect(() => {
    const search = async () => {
      if (searchTerm.length < 2) return setSearchResults([]);
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').ilike('first_name', `%${searchTerm}%`).limit(5);
      if (data) setSearchResults(data);
    };
    const delay = setTimeout(search, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">

          {viewingFriend ? (
            <div className="friend-detail-wrapper">
              <div className="detail-nav">
                <button className="back-btn" onClick={() => setViewingFriend(null)}>
                  <FiArrowLeft size={24} /> Back to Leaderboard
                </button>
              </div>

              {friendLoading ? (
                <div className="lb-placeholder-text">Syncing Friend Data...</div>
              ) : (
                <div className="detail-layout">
                  {/* LEFT COLUMN */}
                  <div className="detail-column">
                    <div className="profile-hero-card">
                      <div className="hero-avatar">
                        {viewingFriend.avatar_url ? <img src={viewingFriend.avatar_url} alt="" /> : <FiUser size={40} />}
                      </div>
                      <div className="hero-info">
                        <h1>{viewingFriend.first_name} {viewingFriend.last_name}</h1>
                        <div className="hero-badge">Health Score: {friendStats?.healthScore}</div>
                      </div>
                    </div>

                    <div className="stats-grid-2col">
                      <div className="glass-card stat-mini">
                        <span className="label">Heart Rate</span>
                        <span className="value">{friendStats?.profile?.heart_rate || '--'} <small>BPM</small></span>
                      </div>
                      <div className="glass-card stat-mini">
                        <span className="label">Sleep</span>
                        <span className="value">{(friendStats?.profile?.sleep_seconds / 3600).toFixed(1)} <small>HRS</small></span>
                      </div>
                    </div>

                    <div className="glass-card award-section">
                      <div className="section-header">
                        <h3>Earned Awards</h3>
                        <FiAward color="#E64A45" />
                      </div>
                      <div className="awards-scroll">
                        {friendStats?.awards.length > 0 ? friendStats.awards.map((a, i) => (
                          <div key={i} className="award-item">
                            <img src={a.icon_url} alt="" className="earned-award-img" />
                            <span className="award-name">{a.award_name}</span>
                          </div>
                        )) : <p className="no-awards-text">No awards earned yet.</p>}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="detail-column">
                    <div className="glass-card ring-focus-card">
                      <h3>Daily Activity</h3>
                      <div className="ring-container-large">
                        <svg viewBox="0 0 100 100" className="svg-ring">
                          <circle className="ring-bg" cx="50" cy="50" r="40" />
                          <circle 
                            className={`ring-progress ${friendStats?.movePercent >= 100 ? 'goal-reached' : ''}`} 
                            cx="50" cy="50" r="40" 
                            style={{ strokeDasharray: `${(friendStats?.movePercent * 2.51)}, 251.2` }} 
                          />
                        </svg>
                        <div className="ring-inner-text">
                          <span className="percent">{Math.round(friendStats?.movePercent)}%</span>
                          <span className="sub">of goal</span>
                        </div>
                      </div>
                      <div className="ring-footer-stats">
                        <div className="f-stat">
                          <span className="f-label">Calories</span>
                          <span className="f-val">{friendStats?.activity?.calories || 0}</span>
                        </div>
                        <div className="f-stat">
                          <span className="f-label">Steps</span>
                          <span className="f-val">{friendStats?.activity?.steps || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card">
                      <h3>Weekly Progress</h3>
                      <div className="weekly-bar-chart">
                        {['M','T','W','T','F','S','S'].map((day, i) => {
                          const height = Math.random() * 80 + 20; // Simulated
                          return (
                            <div key={i} className="bar-wrapper">
                              <div className="bar-bg">
                                <div className={`bar-fill ${height >= 90 ? 'goal-reached' : ''}`} style={{ height: `${height}%` }}></div>
                              </div>
                              <span>{day}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : showLeaderboard ? (
            /* LEADERBOARD VIEW */
            <div className="leaderboard-wrapper">
               <div className="lb-header">
                <button className="lb-transparent-btn" onClick={() => setShowLeaderboard(false)}><FiArrowLeft size={28} /></button>
                <div className="lb-search-bar-alt" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>Find more friends...</div>
                <button className="lb-transparent-btn" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}><FiUserPlus size={28} /></button>
              </div>

              <div className="lb-podium">
                <div className="podium-col second-place" onClick={() => myFriends[1] && handleViewFriend(myFriends[1])}>
                    <span className="podium-rank">2ND</span>
                    <div className="podium-avatar">{myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : <FiUser size={40} />}</div>
                    <span className="podium-score">{myFriends[1]?.score || 0}</span>
                </div>
                <div className="podium-col first-place" onClick={() => myFriends[0] && handleViewFriend(myFriends[0])}>
                    <span className="podium-crown">👑</span>
                    <div className="podium-avatar first-avatar">{myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : <FiUser size={50} />}</div>
                    <span className="podium-score first-score">{myFriends[0]?.score || 0}</span>
                </div>
                <div className="podium-col third-place" onClick={() => myFriends[2] && handleViewFriend(myFriends[2])}>
                    <span className="podium-rank">3RD</span>
                    <div className="podium-avatar">{myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : <FiUser size={40} />}</div>
                    <span className="podium-score">{myFriends[2]?.score || 0}</span>
                </div>
              </div>

              <div className="lb-list-alt">
                {myFriends.slice(3).map((f, i) => (
                  <div key={f.id} className="lb-list-card" onClick={() => handleViewFriend(f)}>
                    <div className="lb-card-left">
                      <div className="lb-card-rank">{i + 4}TH</div>
                      <div className="lb-card-avatar">{f.avatar_url ? <img src={f.avatar_url} alt="" /> : <FiUser />}</div>
                      <span>@{f.first_name?.toLowerCase()}</span>
                    </div>
                    <span className="lb-card-score">{f.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ONBOARDING VIEW */
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
                <div className="inline-search-section">
                  <div className="search-header">
                    <h2>Find Friends</h2>
                    <FiX size={24} onClick={() => setIsSearching(false)} style={{ cursor: 'pointer' }} />
                  </div>
                  <input className="theme-search-input" placeholder="Search name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <div className="results-container">
                    {searchResults.map(u => (
                      <div key={u.id} className="theme-card">
                        <div className="user-info-row">
                          {u.avatar_url ? <img src={u.avatar_url} className="theme-avatar-sm" alt="" /> : <FiUser />}
                          <p className="name-bold">{u.first_name} {u.last_name}</p>
                        </div>
                        <button className="theme-btn-sm" onClick={() => handleSendRequest(u.id)} disabled={sentRequests.includes(u.id)}>
                          {sentRequests.includes(u.id) ? 'Sent' : 'Invite'}
                        </button>
                      </div>
                    ))}
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