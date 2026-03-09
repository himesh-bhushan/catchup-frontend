import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, FiUserPlus, FiCheck, FiTrash2 } from 'react-icons/fi';
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

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch current user profile
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    // 2. Fetch accepted friends
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        sender:profiles!friend_requests_sender_id_fkey (id, first_name, last_name, email, avatar_url),
        receiver:profiles!friend_requests_receiver_id_fkey (id, first_name, last_name, email, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!error && data) {
      let friendsList = data.map(rel =>
        rel.sender_id === user.id ? rel.receiver : rel.sender
      ).filter(f => f !== null);
      
      // 3. Add current user to the list for Leaderboard
      if (currentUser) {
        currentUser.isMe = true; 
        friendsList.push(currentUser);
      }
      
      // Sort by score (Assume score property exists on object or default to 0)
      const sortedFriends = friendsList.sort((a, b) => (b.score || 0) - (a.score || 0));
      setMyFriends(sortedFriends);
      
      if (friendsList.length > 1) {
        localStorage.setItem('has_onboarded_sharing', 'true');
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(5);

      if (!error && data) setSearchResults(data);
    };

    const delaySearch = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);

    if (error) {
      alert("Request already exists.");
      setSentRequests(prev => [...prev, receiverId]);
    } else {
      setSentRequests(prev => [...prev, receiverId]);
      alert("Request sent!");
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
      fetchFriends();
      if (newStatus === 'accepted') {
        localStorage.setItem('has_onboarded_sharing', 'true');
        setShowLeaderboard(true);
        setIsSearching(false);
      }
    }
  };

  const handleViewFriend = async (friend) => {
    setViewingFriend(friend);
    setFriendLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: profile } = await supabase.from('profiles').select('calorie_goal, heart_rate, sleep_seconds, water_intake').eq('id', friend.id).single();
      const { data: activity } = await supabase.from('activity_logs').select('calories, steps').eq('user_id', friend.id).eq('date', todayStr).maybeSingle();

      // Health Score Logic
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

      const totalScore = Math.round(hrScore * 0.35 + sleepScore * 0.25 + calScore * 0.25 + waterScore * 0.15);

      setFriendStats({
        profile,
        activity,
        healthScore: totalScore,
        movePercent: Math.min((cals / goal) * 100, 100)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">

          {viewingFriend ? (
            /* --- FRIEND DETAILS VIEW --- */
            <div className="friend-detail-wrapper">
              <div className="lb-header">
                <button className="lb-transparent-btn" onClick={() => setViewingFriend(null)}>
                  <FiArrowLeft size={28} />
                </button>
                <h2 style={{ margin: 0, color: '#111', fontSize: '1.8rem' }}>
                  @{viewingFriend.first_name?.toLowerCase()} {viewingFriend.isMe ? '(You)' : ''}
                </h2>
              </div>

              {friendLoading ? (
                <div className="lb-placeholder-text">Loading progress...</div>
              ) : (
                <div className="friend-stats-grid">
                  <div className="theme-card friend-stat-card">
                    <h3 style={{ marginTop: 0, color: '#111', width: '100%', marginBottom: '25px' }}>Activity Ring</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', width: '100%' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `conic-gradient(#E64A45 0% ${friendStats?.movePercent || 0}%, #f2f2f2 0% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '75px', height: '75px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#111' }}>
                          {Math.round(friendStats?.movePercent || 0)}%
                        </div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#555' }}>Move: <span style={{ color: '#E64A45' }}>{friendStats?.activity?.calories || 0}</span> / {friendStats?.profile?.calorie_goal || 500} KCAL</p>
                        <p style={{ margin: '0', fontWeight: 'bold', color: '#555' }}>Steps: <span style={{ color: '#E64A45' }}>{friendStats?.activity?.steps || 0}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="theme-card friend-stat-card">
                    <h3 style={{ marginTop: 0, color: '#111', width: '100%', marginBottom: '25px' }}>Health Score</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', width: '100%' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '10px solid #E64A45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', color: '#E64A45' }}>
                        {friendStats?.healthScore || 0}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.95rem', color: '#666' }}><strong>Heart Rate:</strong> {friendStats?.profile?.heart_rate || '--'} BPM</span>
                        <span style={{ fontSize: '0.95rem', color: '#666' }}><strong>Sleep:</strong> {friendStats?.profile?.sleep_seconds ? (friendStats.profile.sleep_seconds / 3600).toFixed(1) : '0'} hrs</span>
                        <span style={{ fontSize: '0.95rem', color: '#666' }}><strong>Water:</strong> {friendStats?.profile?.water_intake ? (friendStats.profile.water_intake / 1000).toFixed(1) : '0'} L</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : showLeaderboard ? (
            /* --- LEADERBOARD VIEW --- */
            <div className="leaderboard-wrapper">
              <div className="lb-header">
                <button className="lb-transparent-btn" onClick={() => { setIsSearching(true); setShowLeaderboard(false); }}>
                  <FiArrowLeft size={28} />
                </button>
                <input className="lb-search-bar-alt" placeholder="Search friend" />
                <button className="lb-transparent-btn" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  <FiUserPlus size={28} />
                </button>
              </div>
              
              <div className="lb-podium">
                <div className="podium-col second-place" onClick={() => myFriends[1] && handleViewFriend(myFriends[1])}>
                    <span className="podium-rank">2ND</span>
                    <div className="podium-avatar">
                      {myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : (myFriends[1] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[1]?.score || 0}</span>
                    <span className="podium-name">{myFriends[1] ? `@${myFriends[1].first_name?.toLowerCase()}${myFriends[1].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
                
                <div className="podium-col first-place" onClick={() => myFriends[0] && handleViewFriend(myFriends[0])}>
                    <span className="podium-crown">👑</span>
                    <div className="podium-avatar first-avatar">
                      {myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : (myFriends[0] ? <FiUser size={50} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score first-score">{myFriends[0]?.score || 0}</span>
                    <span className="podium-name">{myFriends[0] ? `@${myFriends[0].first_name?.toLowerCase()}${myFriends[0].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
                
                <div className="podium-col third-place" onClick={() => myFriends[2] && handleViewFriend(myFriends[2])}>
                    <span className="podium-rank">3RD</span>
                    <div className="podium-avatar">
                      {myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : (myFriends[2] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[2]?.score || 0}</span>
                    <span className="podium-name">{myFriends[2] ? `@${myFriends[2].first_name?.toLowerCase()}${myFriends[2].isMe ? ' (You)' : ''}` : ''}</span>
                </div>
              </div>

              <div className="lb-list-alt">
                {myFriends.slice(3).map((friend, index) => (
                  <div key={friend.id || index} className="lb-list-card" onClick={() => handleViewFriend(friend)}>
                    <div className="lb-card-left">
                      <div className="lb-card-rank">{index + 4}TH<br/><span className="rank-up-arrow">▲</span></div>
                      <div className="lb-card-avatar">
                         {friend.avatar_url ? <img src={friend.avatar_url} alt="" /> : <FiUser size={30} color="#E64A45" />}
                      </div>
                      <span className="lb-card-name">@{friend.first_name?.toLowerCase()} {friend.isMe && '(You)'}</span>
                    </div>
                    <span className="lb-card-score">{friend.score || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- ONBOARDING VIEW --- */
            <div className="sharing-onboarding-wrapper">
              {!isSearching ? (
                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" alt="Avatar 1" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" alt="Avatar 2" />
                    <img src={avatar3} className="sharing-avatar side-avatar" alt="Avatar 3" />
                  </div>
                  <h1 className="sharing-title">Health Sharing</h1>
                  <p className="sharing-subtitle">Invite your friends to join the fun and start sharing. The more you participate, the higher you climb.</p>
                  <div className="sharing-features-grid">
                    <div className="feature-item">
                      <FiCheckCircle size={36} color="#E64A45" />
                      <div className="feature-text-block">
                        <h3>Stay in charge</h3>
                        <p>Keep friends and family up to date by securely sharing your health data summary.</p>
                      </div>
                    </div>
                    <div className="feature-item">
                      <FiLock size={36} color="#E64A45" />
                      <div className="feature-text-block">
                        <h3>Private and Secure</h3>
                        <p>Only a summary is shared. All data is encrypted and you can stop sharing anytime.</p>
                      </div>
                    </div>
                  </div>
                  <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Share with Someone</button>
                </>
              ) : (
                /* --- SEARCH & APPROVAL VIEW --- */
                <div className="inline-search-section theme-container">
                  <div className="search-header">
                    <h3 className="theme-heading">Find and Approve Friends</h3>
                    <button className="close-btn" onClick={() => {
                        if (myFriends.length > 1) {
                            setShowLeaderboard(true);
                            setIsSearching(false);
                        } else {
                            setIsSearching(false);
                        }
                    }}>
                      <FiX size={24} />
                    </button>
                  </div>

                  {incomingRequests.length > 0 && (
                    <div className="request-group">
                      <h4 className="section-label">Pending Invitations</h4>
                      {incomingRequests.map((req) => (
                        <div key={req.id} className="theme-card highlight-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="theme-avatar-sm" alt="" /> : <div className="theme-avatar-sm"><FiUser /></div>}
                            </div>
                            <div className="text-group">
                              <p className="name-bold">{req.profiles?.first_name} {req.profiles?.last_name}</p>
                              <p className="subtext-red">Wants to share progress</p>
                            </div>
                          </div>
                          <div className="action-btns-row">
                            <button className="icon-btn approve" onClick={() => updateRequestStatus(req.id, 'accepted')}><FiCheck /> Approve</button>
                            <button className="icon-btn decline" onClick={() => updateRequestStatus(req.id, 'declined')}><FiTrash2 /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="search-input-wrapper">
                    <input className="theme-search-input" placeholder="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="results-container">
                    {searchResults.length > 0 && <h4 className="section-label">Search Results</h4>}
                    {searchResults.map(u => (
                      <div key={u.id} className="theme-card">
                        <div className="user-info-row">
                          <div className="avatar-wrapper">
                            {u.avatar_url ? <img src={u.avatar_url} className="theme-avatar-sm" alt="" /> : <div className="theme-avatar-sm"><FiUser /></div>}
                          </div>
                          <div className="text-group">
                            <p className="name-bold">{u.first_name} {u.last_name}</p>
                            <p className="subtext-gray">{u.email}</p>
                          </div>
                        </div>
                        <button 
                          className={`theme-btn-sm ${sentRequests.includes(u.id) ? 'requested' : ''}`}
                          onClick={() => handleSendRequest(u.id)}
                          disabled={sentRequests.includes(u.id)}
                        >
                          {sentRequests.includes(u.id) ? 'Requested' : 'Invite'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="friends-list-group">
                    <h4 className="section-label">Your Network ({myFriends.filter(f => !f.isMe).length})</h4>
                    <div className="friends-grid">
                      {myFriends.filter(f => !f.isMe).map((friend) => (
                        <div key={friend.id} className="theme-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {friend.avatar_url ? <img src={friend.avatar_url} className="theme-avatar-sm" alt="" /> : <div className="theme-avatar-sm"><FiUser /></div>}
                            </div>
                            <div className="text-group">
                              <p className="name-bold">{friend.first_name} {friend.last_name}</p>
                              <span className="badge-online">Connected</span>
                            </div>
                          </div>
                          <button className="theme-btn-outline" onClick={() => { setIsSearching(false); handleViewFriend(friend); }}>View Progress</button>
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