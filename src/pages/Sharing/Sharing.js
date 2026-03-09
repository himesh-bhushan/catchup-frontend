import React, { useState, useEffect } from 'react';
import { 
  FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, 
  FiUserPlus, FiCheck, FiTrash2, FiAward, FiHeart, FiActivity 
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

  // --- DATA FETCHING ---

  const fetchIncomingRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        profiles:sender_id (first_name, last_name, email, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (!error) setIncomingRequests(data);
  };

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

  const fetchFriends = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`sender_id, receiver_id`)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);

    if (!error) {
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

      const sorted = networkWithScores.sort((a, b) => b.score - a.score);
      setMyFriends(sorted);

      if (sorted.length > 1) localStorage.setItem('has_onboarded_sharing', 'true');
    }
  };

  // --- ACTIONS ---

  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);

    if (error) alert("Request already exists.");
    setSentRequests(prev => [...prev, receiverId]);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      fetchFriends();
      if (newStatus === 'accepted') {
        localStorage.setItem('has_onboarded_sharing', 'true');
        setShowLeaderboard(true);
        setIsSearching(false);
      }
    }
  };

  const handleRemoveFriend = async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);
    if (!error) fetchFriends();
  };

  const handleViewFriend = async (friend) => {
    setViewingFriend(friend);
    setFriendLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 6);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', friend.id).single();
      const { data: activity } = await supabase.from('activity_logs').select('*').eq('user_id', friend.id).eq('date', todayStr).maybeSingle();
      const { data: weeklyLogs } = await supabase
        .from('activity_logs')
        .select('date, calories')
        .eq('user_id', friend.id)
        .gte('date', lastWeekStr)
        .order('date', { ascending: true });

      const score = calculateUserScore(profile, activity);
      const movePercent = profile?.calorie_goal > 0 ? ((activity?.calories || 0) / profile.calorie_goal) * 100 : 0;

      const awards = [
        { id: 1, icon: '🔥', label: '7 Day Streak', color: '#FF9500' },
        { id: 2, icon: '🏆', label: 'Goal Crusher', color: '#FFCC00' },
        { id: 3, icon: '💧', label: 'Hydration Pro', color: '#007AFF' },
        { id: 4, icon: '⭐', label: 'Elite Member', color: '#E64A45' }
      ];

      setFriendWeeklyData(weeklyLogs || []);
      setFriendStats({ profile, activity, healthScore: score, movePercent: Math.min(movePercent, 100), awards });
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  };

  // --- SEARCH EFFECT ---
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(5);
      if (data) setSearchResults(data);
    };
    const delaySearch = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">

          {/* VIEW 1: FRIEND DETAIL VIEW */}
          {viewingFriend ? (
            <div className="friend-detail-wrapper">
              <div className="detail-nav">
                <button className="back-btn" onClick={() => setViewingFriend(null)}>
                  <FiArrowLeft size={24} /> Back to Leaderboard
                </button>
              </div>

              {friendLoading ? (
                <div className="lb-placeholder-text">Syncing data...</div>
              ) : (
                <div className="detail-layout">
                  {/* Left Column */}
                  <div className="detail-column">
                    <div className="profile-hero-card">
                      <div className="hero-avatar">
                        {viewingFriend.avatar_url ? (
                          <img src={viewingFriend.avatar_url} alt="" />
                        ) : (
                          <FiUser size={40} />
                        )}
                      </div>
                      <div className="hero-info">
                        <h1>{viewingFriend.first_name} {viewingFriend.last_name}</h1>
                        <p>@{viewingFriend.first_name?.toLowerCase()}</p>
                        <div className="hero-badge">Health Score: {friendStats?.healthScore}</div>
                      </div>
                    </div>

                    <div className="stats-grid-2col">
                      <div className="glass-card stat-mini">
                        <span className="label">Heart Rate</span>
                        <span className="value">
                          {friendStats?.profile?.heart_rate || '--'} <small>BPM</small>
                        </span>
                      </div>
                      <div className="glass-card stat-mini">
                        <span className="label">Sleep</span>
                        <span className="value">
                          {(friendStats?.profile?.sleep_seconds / 3600).toFixed(1) || '0'} <small>HRS</small>
                        </span>
                      </div>
                    </div>

                    <div className="glass-card award-section">
                      <div className="section-header">
                        <h3>Awards & Achievements</h3>
                        <FiAward color="#E64A45" />
                      </div>
                      <div className="awards-scroll">
                        {friendStats?.awards?.map(award => (
                          <div key={award.id} className="award-item">
                            <span className="award-icon">{award.icon}</span>
                            <span className="award-name">{award.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="detail-column">
                    <div className="glass-card ring-focus-card">
                      <h3>Daily Activity</h3>
                      <div className="ring-container-large">
                        <svg viewBox="0 0 100 100" className="svg-ring">
                          <circle className="ring-bg" cx="50" cy="50" r="40" />
                          <circle 
                            className="ring-progress" 
                            cx="50" cy="50" r="40" 
                            style={{ 
                              strokeDasharray: `${(friendStats?.movePercent * 2.51)}, 251.2` 
                            }} 
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
                        <div className="divider" />
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
                          const height = Math.random() * 60 + 20; // Simulated for demo
                          return (
                            <div key={i} className="bar-wrapper">
                              <div className="bar-bg">
                                <div className="bar-fill" style={{ height: `${height}%` }}></div>
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
            /* VIEW 2: LEADERBOARD */
            <div className="leaderboard-wrapper">
              <div className="lb-header">
                <button className="lb-transparent-btn" onClick={() => setShowLeaderboard(false)}>
                  <FiArrowLeft size={28} />
                </button>
                <div className="lb-search-bar-alt" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  Find more friends...
                </div>
                <button className="lb-transparent-btn" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  <FiUserPlus size={28} />
                </button>
              </div>
              
              <div className="lb-podium">
                {/* 2nd Place */}
                <div className="podium-col second-place" onClick={() => myFriends[1] && handleViewFriend(myFriends[1])}>
                    <span className="podium-rank">2ND</span>
                    <div className="podium-avatar">
                      {myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : (myFriends[1] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[1]?.score || 0}</span>
                    <span className="podium-name">{myFriends[1] ? `@${myFriends[1].first_name?.toLowerCase()}` : ''}</span>
                </div>
                
                {/* 1st Place */}
                <div className="podium-col first-place" onClick={() => myFriends[0] && handleViewFriend(myFriends[0])}>
                    <span className="podium-crown">👑</span>
                    <div className="podium-avatar first-avatar">
                      {myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : (myFriends[0] ? <FiUser size={50} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score first-score">{myFriends[0]?.score || 0}</span>
                    <span className="podium-name">{myFriends[0] ? `@${myFriends[0].first_name?.toLowerCase()}` : ''}</span>
                </div>
                
                {/* 3rd Place */}
                <div className="podium-col third-place" onClick={() => myFriends[2] && handleViewFriend(myFriends[2])}>
                    <span className="podium-rank">3RD</span>
                    <div className="podium-avatar">
                      {myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : (myFriends[2] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[2]?.score || 0}</span>
                    <span className="podium-name">{myFriends[2] ? `@${myFriends[2].first_name?.toLowerCase()}` : ''}</span>
                </div>
              </div>

              <div className="lb-list-alt">
                {myFriends.slice(3).map((friend, index) => (
                  <div key={friend.id} className="lb-list-card" onClick={() => handleViewFriend(friend)}>
                    <div className="lb-card-left">
                      <div className="lb-card-rank">{index + 4}TH</div>
                      <div className="lb-card-avatar">
                         {friend.avatar_url ? <img src={friend.avatar_url} alt="" /> : <FiUser size={24} />}
                      </div>
                      <span className="lb-card-name">@{friend.first_name?.toLowerCase()}</span>
                    </div>
                    <span className="lb-card-score">{friend.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW 3: ONBOARDING / SEARCH */
            <div className="sharing-onboarding-wrapper">
              {!isSearching ? (
                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" alt="" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" alt="" />
                    <img src={avatar3} className="sharing-avatar side-avatar" alt="" />
                  </div>
                  <h1 className="sharing-title">Health Sharing</h1>
                  <p className="sharing-subtitle">Stay motivated by sharing your progress with friends.</p>
                  <div className="sharing-features-grid">
                    <div className="feature-item">
                      <FiCheckCircle size={32} color="#E64A45" />
                      <div className="feature-text-block">
                        <h3>Stay in charge</h3>
                        <p>Share only your health summary, never your private details.</p>
                      </div>
                    </div>
                  </div>
                  <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Get Started</button>
                </>
              ) : (
                <div className="inline-search-section">
                  <div className="search-header">
                    <h2>Find Friends</h2>
                    <FiX size={24} onClick={() => setIsSearching(false)} style={{ cursor: 'pointer' }} />
                  </div>
                  
                  <input 
                    className="theme-search-input" 
                    placeholder="Search by name or email..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />

                  <div className="results-container">
                    {searchResults.map(u => (
                      <div key={u.id} className="theme-card search-result-card">
                        <div className="user-info-row">
                          <div className="avatar-wrapper">
                            {u.avatar_url ? <img src={u.avatar_url} className="theme-avatar-sm" alt="" /> : <FiUser />}
                          </div>
                          <div>
                            <p className="name-bold">{u.first_name} {u.last_name}</p>
                            <p className="subtext-gray">{u.email}</p>
                          </div>
                        </div>
                        <button 
                          className="theme-btn-sm"
                          onClick={() => handleSendRequest(u.id)}
                          disabled={sentRequests.includes(u.id)}
                        >
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