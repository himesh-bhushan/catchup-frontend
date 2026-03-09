import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, FiUserPlus, FiCheck, FiTrash2, FiActivity, FiDroplet, FiMoon, FiZap, FiHeart } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';

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
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('has_onboarded_sharing');
    if (hasOnboarded === 'true') {
      setShowLeaderboard(true);
    }
    fetchIncomingRequests();
    fetchFriends();
  }, []);

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
      .select('sender_id, receiver_id')
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

      setMyFriends(networkWithScores.sort((a, b) => b.score - a.score));
      if (networkWithScores.length > 1) localStorage.setItem('has_onboarded_sharing', 'true');
    }
  };

  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('friend_requests').insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);
    setSentRequests(prev => [...prev, receiverId]);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    await supabase.from('friend_requests').update({ status: newStatus }).eq('id', requestId);
    setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
    fetchFriends();
  };

  const handleRemoveFriend = async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!window.confirm("Remove this friend and stop sharing data?")) return;
    await supabase.from('friend_requests').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);
    fetchFriends();
  };

  const handleViewFriend = async (friend) => {
    setViewingFriend(friend);
    setFriendLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', friend.id).single();
      const { data: activity } = await supabase.from('activity_logs').select('*').eq('user_id', friend.id).eq('date', todayStr).maybeSingle();

      setFriendStats({
        profile,
        activity,
        score: calculateUserScore(profile, activity),
        movePercent: Math.min(((activity?.calories || 0) / (profile?.calorie_goal || 500)) * 100, 100)
      });
    } catch (err) { console.error(err); } finally { setFriendLoading(false); }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim().length < 2) { setSearchResults([]); return; }
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url')
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`).limit(5);
      if (data) setSearchResults(data);
    };
    const delaySearch = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  return (
    <div className="sharing-stretch-container">
      <DashboardNav />
      <div className="sharing-main-canvas">
        
        {viewingFriend ? (
          <div className="friend-detail-dashboard">
            <header className="detail-header">
              <button className="back-circle" onClick={() => setViewingFriend(null)}><FiArrowLeft /></button>
              <div className="user-info-cluster">
                <div className="large-avatar">
                   {viewingFriend.avatar_url ? <img src={viewingFriend.avatar_url} alt="" /> : <FiUser />}
                </div>
                <div>
                  <h1>@{viewingFriend.first_name?.toLowerCase()}</h1>
                  <p className="live-status"><span className="dot"></span> Online Activity</p>
                </div>
              </div>
              <div className="score-badge-large">
                <label>HEALTH SCORE</label>
                <div className="val">{friendStats?.score || 0}</div>
              </div>
            </header>

            {friendLoading ? (
              <div className="loading-state">Syncing data...</div>
            ) : (
              <div className="detail-grid">
                {/* Activity Ring Section */}
                <div className="stat-glass-card activity-focus">
                  <h3>Activity Ring</h3>
                  <div className="ring-visual">
                    <svg viewBox="0 0 100 100">
                      <circle className="bg" cx="50" cy="50" r="45" />
                      <circle className="meter" cx="50" cy="50" r="45" style={{ strokeDashoffset: 282 - (282 * (friendStats?.movePercent || 0)) / 100 }} />
                    </svg>
                    <div className="ring-inner">
                      <span className="percent">{Math.round(friendStats?.movePercent || 0)}%</span>
                      <span className="label">of goal</span>
                    </div>
                  </div>
                  <div className="activity-stats">
                    <div className="a-item"><FiZap /> <span>{friendStats?.activity?.calories || 0} kcal</span></div>
                    <div className="a-item"><FiActivity /> <span>{friendStats?.activity?.steps || 0} steps</span></div>
                  </div>
                </div>

                {/* Grid of Health Data */}
                <div className="vitals-grid">
                  <div className="mini-glass-card">
                    <div className="icon heart"><FiHeart /></div>
                    <div className="data">
                      <label>Heart Rate</label>
                      <p>{friendStats?.profile?.heart_rate || '--'} <span>BPM</span></p>
                    </div>
                  </div>
                  <div className="mini-glass-card">
                    <div className="icon sleep"><FiMoon /></div>
                    <div className="data">
                      <label>Sleep Time</label>
                      <p>{friendStats?.profile?.sleep_seconds ? (friendStats.profile.sleep_seconds / 3600).toFixed(1) : '0'} <span>hrs</span></p>
                    </div>
                  </div>
                  <div className="mini-glass-card">
                    <div className="icon water"><FiDroplet /></div>
                    <div className="data">
                      <label>Water Intake</label>
                      <p>{friendStats?.profile?.water_intake ? (friendStats.profile.water_intake / 1000).toFixed(1) : '0'} <span>Liters</span></p>
                    </div>
                  </div>
                  <div className="mini-glass-card">
                    <div className="icon activity"><FiZap /></div>
                    <div className="data">
                      <label>Daily Goal</label>
                      <p>{friendStats?.profile?.calorie_goal || 500} <span>kcal</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : showLeaderboard ? (
          <div className="leaderboard-full-stretch">
            <div className="lb-header-sticky">
              <h2>Community Rankings</h2>
              <div className="lb-actions">
                <button className="add-friend-btn" onClick={() => {setIsSearching(true); setShowLeaderboard(false);}}>
                  <FiUserPlus /> Add Someone
                </button>
              </div>
            </div>

            <div className="podium-area">
              <div className="podium-item silver" onClick={() => myFriends[1] && handleViewFriend(myFriends[1])}>
                <div className="p-avatar">{myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : <FiUser />}</div>
                <div className="p-name">@{myFriends[1]?.first_name?.toLowerCase()}</div>
                <div className="p-score">{myFriends[1]?.score || 0}</div>
                <div className="p-rank">2</div>
              </div>
              <div className="podium-item gold" onClick={() => myFriends[0] && handleViewFriend(myFriends[0])}>
                <div className="crown">👑</div>
                <div className="p-avatar">{myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : <FiUser />}</div>
                <div className="p-name">@{myFriends[0]?.first_name?.toLowerCase()}</div>
                <div className="p-score">{myFriends[0]?.score || 0}</div>
                <div className="p-rank">1</div>
              </div>
              <div className="podium-item bronze" onClick={() => myFriends[2] && handleViewFriend(myFriends[2])}>
                <div className="p-avatar">{myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : <FiUser />}</div>
                <div className="p-name">@{myFriends[2]?.first_name?.toLowerCase()}</div>
                <div className="p-score">{myFriends[2]?.score || 0}</div>
                <div className="p-rank">3</div>
              </div>
            </div>

            <div className="lb-table">
              {myFriends.slice(3).map((f, i) => (
                <div key={f.id} className="lb-row-stretch" onClick={() => handleViewFriend(f)}>
                  <span className="rank-num">{i + 4}</span>
                  <div className="user-cell">
                    {f.avatar_url ? <img src={f.avatar_url} alt="" /> : <FiUser />}
                    <span>{f.first_name} {f.isMe && "(You)"}</span>
                  </div>
                  <div className="score-cell">{f.score} pts</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sharing-onboarding-wrapper">
             {!isSearching ? (
                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" alt="" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" alt="" />
                    <img src={avatar3} className="sharing-avatar side-avatar" alt="" />
                  </div>
                  <h1 className="sharing-title">Health Sharing</h1>
                  <p className="sharing-subtitle">Invite your friends to join the fun and start sharing. The more you participate, the higher you climb.</p>
                  <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Share with Someone</button>
                </>
             ) : (
                <div className="inline-search-section theme-container">
                   {/* [Search UI remains similar but follows stretch theme] */}
                   <div className="search-header">
                    <h3 className="theme-heading">Find Friends</h3>
                    <button className="close-btn" onClick={() => { if(myFriends.length > 1) {setShowLeaderboard(true); setIsSearching(false);}} }><FiX size={24} /></button>
                  </div>
                  <input className="theme-search-input" placeholder="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  
                  <div className="friends-list-group">
                    <h4 className="section-label">Your Network</h4>
                    <div className="friends-grid-stretched">
                      {myFriends.filter(f => !f.isMe).map((friend) => (
                        <div key={friend.id} className="theme-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {friend.avatar_url ? <img src={friend.avatar_url} className="theme-avatar-sm" alt="" /> : <div className="theme-avatar-sm"><FiUser /></div>}
                            </div>
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
  );
};

export default Sharing;