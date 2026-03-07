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
  // Default to false, logic in useEffect will determine if we flip this to true
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myFriends, setMyFriends] = useState([]);

  useEffect(() => {
    // Check if user has completed onboarding before
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
      const friendsList = data.map(rel =>
        rel.sender_id === user.id ? rel.receiver : rel.sender
      );
      
      // Sort friends by score if available, otherwise fallback
      const sortedFriends = friendsList.sort((a, b) => (b.score || 0) - (a.score || 0));
      setMyFriends(sortedFriends);
      
      // Optimization: If they already have friends, they shouldn't see onboarding
      if (friendsList.length > 0) {
          localStorage.setItem('has_onboarded_sharing', 'true');
          setShowLeaderboard(true);
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
    } else {
        // Once they interact with the social features, consider onboarding complete
        localStorage.setItem('has_onboarded_sharing', 'true');
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
      }
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">

      <DashboardNav />

      <div className="dashboard-content">

        <div className="sharing-page-container">

          {showLeaderboard ? (
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
                {/* 2nd Place */}
                <div className="podium-col second-place">
                    <span className="podium-rank">2ND</span>
                    <div className="podium-avatar">
                      {myFriends[1]?.avatar_url ? <img src={myFriends[1].avatar_url} alt="" /> : (myFriends[1] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[1]?.score || 0}</span>
                    <span className="podium-name">{myFriends[1] ? `@${myFriends[1].first_name?.toLowerCase() || 'user'}` : ''}</span>
                </div>
                
                {/* 1st Place */}
                <div className="podium-col first-place">
                    <span className="podium-crown">👑</span>
                    <div className="podium-avatar first-avatar">
                      {myFriends[0]?.avatar_url ? <img src={myFriends[0].avatar_url} alt="" /> : (myFriends[0] ? <FiUser size={50} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score first-score">{myFriends[0]?.score || 0}</span>
                    <span className="podium-name">{myFriends[0] ? `@${myFriends[0].first_name?.toLowerCase() || 'user'}` : ''}</span>
                </div>
                
                {/* 3rd Place */}
                <div className="podium-col third-place">
                    <span className="podium-rank">3RD</span>
                    <div className="podium-avatar">
                      {myFriends[2]?.avatar_url ? <img src={myFriends[2].avatar_url} alt="" /> : (myFriends[2] ? <FiUser size={40} color="#E64A45" /> : null)}
                    </div>
                    <span className="podium-score">{myFriends[2]?.score || 0}</span>
                    <span className="podium-name">{myFriends[2] ? `@${myFriends[2].first_name?.toLowerCase() || 'user'}` : ''}</span>
                </div>
              </div>

              <div className="lb-list-alt">
                {myFriends.slice(3).map((friend, index) => (
                  <div key={friend.id || index} className="lb-list-card">
                    <div className="lb-card-left">
                      <div className="lb-card-rank">
                        {index + 4}TH<br/>
                        <span className="rank-up-arrow">▲</span>
                      </div>
                      <div className="lb-card-avatar">
                         {friend.avatar_url ? <img src={friend.avatar_url} alt="" /> : <FiUser size={30} color="#E64A45" />}
                      </div>
                      <span className="lb-card-name">@{friend.first_name?.toLowerCase() || 'user'}</span>
                    </div>
                    <span className="lb-card-score">{friend.score || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (

            <div className="sharing-onboarding-wrapper">

              {!isSearching ? (
                /* --- ONBOARDING VIEW --- */
                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" alt="Avatar 1" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" alt="Avatar 2" />
                    <img src={avatar3} className="sharing-avatar side-avatar" alt="Avatar 3" />
                  </div>

                  <h1 className="sharing-title">Health Sharing</h1>

                  <p className="sharing-subtitle">
                    Invite your friends to join the fun and start sharing.
                    The more you participate, the higher you climb on the leaderboard.
                  </p>

                  <div className="sharing-features-grid">

                    <div className="feature-item">
                      <FiCheckCircle size={36} color="#E64A45" />
                      <div className="feature-text-block">
                        <h3>Stay in charge</h3>
                        <p>
                          Keep friends and family up to date on how you’re doing
                          by securely sharing your health data.
                        </p>
                      </div>
                    </div>

                    <div className="feature-item">
                      <FiLock size={36} color="#E64A45" />
                      <div className="feature-text-block">
                        <h3>Private and Secure</h3>
                        <p>
                          Only a summary is shared, not detailed information.
                          All data is encrypted and you can stop sharing anytime.
                        </p>
                      </div>
                    </div>

                  </div>

                  <button
                    className="share-cta-btn"
                    onClick={() => setIsSearching(true)}
                  >
                    Share with Someone
                  </button>

                </>

              ) : (
                /* --- SEARCH & APPROVAL VIEW --- */
                <div className="inline-search-section theme-container">

                  <div className="search-header">
                    <h3 className="theme-heading">Find and Approve Friends</h3>

                    <button className="close-btn" onClick={() => {
                        // If they have friends, closing search should go back to leaderboard
                        if (myFriends.length > 0) {
                            setShowLeaderboard(true);
                            setIsSearching(false);
                        } else {
                            setIsSearching(false);
                        }
                    }}>
                      <FiX size={24} />
                    </button>
                  </div>

                  {/* PENDING REQUESTS */}
                  {incomingRequests.length > 0 && (
                    <div className="request-group">
                      <h4 className="section-label">Pending Invitations</h4>
                      {incomingRequests.map((req) => (
                        <div key={req.id} className="theme-card highlight-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {req.profiles?.avatar_url ? (
                                  <img src={req.profiles.avatar_url} alt="Profile" className="theme-avatar-sm" />
                              ) : (
                                  <div className="theme-avatar-sm"><FiUser /></div>
                              )}
                            </div>
                            <div className="text-group">
                              <p className="name-bold">{req.profiles?.first_name} {req.profiles?.last_name}</p>
                              <p className="subtext-red">Wants to share progress</p>
                            </div>
                          </div>
                          <div className="action-btns-row">
                            <button className="icon-btn approve" onClick={() => updateRequestStatus(req.id, 'accepted')}>
                                <FiCheck /> Approve
                            </button>
                            <button className="icon-btn decline" onClick={() => updateRequestStatus(req.id, 'declined')}>
                                <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SEARCH INPUT */}
                  <div className="search-input-wrapper">
                    <input
                      className="theme-search-input"
                      placeholder="Search name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* SEARCH RESULTS */}
                  <div className="results-container">
                    {searchResults.length > 0 && <h4 className="section-label">Search Results</h4>}
                    {searchResults.map(u => (
                      <div key={u.id} className="theme-card">
                        <div className="user-info-row">
                          <div className="avatar-wrapper">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} className="theme-avatar-sm" alt="User" />
                            ) : (
                              <div className="theme-avatar-sm"><FiUser /></div>
                            )}
                          </div>
                          <div className="text-group">
                            <p className="name-bold">{u.first_name} {u.last_name}</p>
                            <p className="subtext-gray">{u.email}</p>
                          </div>
                        </div>

                        <button
                          className="theme-btn-sm"
                          onClick={() => handleSendRequest(u.id)}
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* CURRENT FRIENDS */}
                  <div className="friends-list-group">
                    <h4 className="section-label">Your Friends ({myFriends.length})</h4>
                    <div className="friends-grid">
                      {myFriends.map((friend) => (
                        <div key={friend.id} className="theme-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {friend.avatar_url ? (
                                  <img src={friend.avatar_url} alt="Profile" className="theme-avatar-sm" />
                              ) : (
                                  <div className="theme-avatar-sm"><FiUser /></div>
                              )}
                            </div>
                            <div className="text-group">
                              <p className="name-bold">{friend.first_name} {friend.last_name}</p>
                              <span className="badge-online">Connected</span>
                            </div>
                          </div>
                          <button className="theme-btn-outline" onClick={() => setShowLeaderboard(true)}>View Progress</button>
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