import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, FiUserPlus, FiCheck, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../supabase'; 

import DashboardNav from '../../components/DashboardNav'; 

// Import your static assets for the onboarding view
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  // --- STATES ---
  const [isSearching, setIsSearching] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myFriends, setMyFriends] = useState([]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
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
      const friendsList = data.map(rel => rel.sender_id === user.id ? rel.receiver : rel.sender);
      setMyFriends(friendsList);
    }
  };

  // --- SEARCH LOGIC ---
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
    const delaySearch = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // --- ACTIONS ---
  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);
    
    if (error) alert("Request already exists.");
    else alert("Request sent!");
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      fetchFriends();
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">
          
          <div className="sharing-onboarding-wrapper">
            {!isSearching ? (
              /* --- INITIAL ONBOARDING VIEW --- */
              <>
                <div className="avatar-group">
                  <img src={avatar1} alt="1" className="sharing-avatar side-avatar" />
                  <img src={avatar2} alt="2" className="sharing-avatar middle-avatar" />
                  <img src={avatar3} alt="3" className="sharing-avatar side-avatar" />
                </div>
                <h1 className="sharing-title">Health Sharing</h1>
                <p className="sharing-subtitle">Invite friends to climb the leaderboard.</p>
                <div className="sharing-features-grid">
                  <div className="feature-item">
                    <FiCheckCircle size={36} color="#E64A45" />
                    <div className="feature-text"><h3>Stay in charge</h3><p>Securely share your summary data.</p></div>
                  </div>
                  <div className="feature-item">
                    <FiLock size={36} color="#E64A45" />
                    <div className="feature-text"><h3>Private</h3><p>Encrypted data you can stop sharing anytime.</p></div>
                  </div>
                </div>
                <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Share with Someone</button>
              </>
            ) : (
              /* --- FIND AND APPROVE FRIENDS VIEW --- */
              <div className="inline-search-section theme-container">
                <div className="search-header">
                  <h3 className="theme-heading">Find and Approve Friends</h3>
                  <button className="close-btn" onClick={() => setIsSearching(false)}><FiX size={24} /></button>
                </div>

                {/* PENDING REQUESTS SECTION */}
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
                            <p className="subtext-red">Wants to connect</p>
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
                <div className="search-bar-wrapper">
                  <input 
                    type="text" 
                    className="theme-search-input" 
                    placeholder="Search name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* SEARCH RESULTS */}
                <div className="results-container">
                  {searchResults.map((u) => (
                    <div key={u.id} className="theme-card">
                      <div className="user-info-row">
                        <div className="avatar-wrapper">
                          {u.avatar_url ? (
                              <img src={u.avatar_url} alt="Profile" className="theme-avatar-sm" />
                          ) : (
                              <div className="theme-avatar-sm"><FiUser /></div>
                          )}
                        </div>
                        <p className="name-bold">{u.first_name} {u.last_name}</p>
                      </div>
                      <button className="theme-btn-sm" onClick={() => handleSendRequest(u.id)}>Invite</button>
                    </div>
                  ))}
                </div>

                {/* FRIENDS LIST SECTION */}
                <div className="friends-list-group">
                  <h4 className="section-label">Your Friends ({myFriends.length})</h4>
                  {myFriends.length === 0 ? (
                    <p className="empty-state-text">No friends added yet.</p>
                  ) : (
                    <div className="friends-grid">
                      {myFriends.map((friend) => (
                        <div key={friend.id} className="theme-card">
                          <div className="user-info-row">
                            <div className="avatar-wrapper">
                              {friend.avatar_url ? (
                                  <img src={friend.avatar_url} alt="Profile" className="theme-avatar-sm active-border" />
                              ) : (
                                  <div className="theme-avatar-sm active-border"><FiUser /></div>
                              )}
                            </div>
                            <div className="text-group">
                              <p className="name-bold">{friend.first_name} {friend.last_name}</p>
                              <span className="badge-online">Connected</span>
                            </div>
                          </div>
                          <button className="theme-btn-outline" onClick={() => { /* Logic to view friend details */ }}>View Progress</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sharing;