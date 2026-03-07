import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser, FiCheck, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../supabase'; 
import DashboardNav from '../../components/DashboardNav'; 

import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myFriends, setMyFriends] = useState([]);

  useEffect(() => {
    fetchIncomingRequests();
    fetchFriends();
  }, []);

  const fetchIncomingRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`id, sender_id, profiles:sender_id (first_name, last_name, avatar_url)`)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (!error) setIncomingRequests(data);
  };

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`id, sender_id, receiver_id, sender:profiles!friend_requests_sender_id_fkey (id, first_name, last_name, avatar_url), receiver:profiles!friend_requests_receiver_id_fkey (id, first_name, last_name, avatar_url)`)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (!error && data) {
      const friendsList = data.map(rel => rel.sender_id === user.id ? rel.receiver : rel.sender);
      setMyFriends(friendsList);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    const { error } = await supabase.from('friend_requests').update({ status: newStatus }).eq('id', requestId);
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
              <>
                <div className="avatar-group">
                  <img src={avatar1} alt="1" className="sharing-avatar side-avatar" />
                  <img src={avatar2} alt="2" className="sharing-avatar middle-avatar" />
                  <img src={avatar3} alt="3" className="sharing-avatar side-avatar" />
                </div>
                <h1 className="sharing-title">Health Sharing</h1>
                <p className="sharing-subtitle">Invite friends to climb the leaderboard.</p>
                <button className="share-cta-btn" onClick={() => setIsSearching(true)}>Share with Someone</button>
              </>
            ) : (
              <div className="inline-search-section theme-container">
                <div className="search-header">
                  <h3 className="theme-heading">Find and Approve Friends</h3>
                  <button className="close-btn" onClick={() => setIsSearching(false)}><FiX size={24} /></button>
                </div>

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

                <input 
                  type="text" 
                  className="theme-search-input" 
                  placeholder="Search name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

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
                        <button className="theme-btn-outline">View Progress</button>
                      </div>
                    ))}
                  </div>
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