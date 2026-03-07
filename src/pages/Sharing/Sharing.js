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

  const leaderboardData = [
    { rank: 1, name: '@kiki1215', score: '10204' },
    { rank: 2, name: '@jane_19', score: '10008' },
    { rank: 3, name: '@balabala:)', score: '9879' },
    { rank: 4, name: '@jujurara', score: '9764' },
    { rank: 5, name: '@12345670', score: '8709' },
    { rank: 6, name: '@holyvoly', score: '7999' }
  ];

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
        profiles:sender_id (first_name, last_name, email)
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
        sender:profiles!friend_requests_sender_id_fkey (id, first_name, last_name, email),
        receiver:profiles!friend_requests_receiver_id_fkey (id, first_name, last_name, email)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!error && data) {
      const friendsList = data.map(rel =>
        rel.sender_id === user.id ? rel.receiver : rel.sender
      );
      setMyFriends(friendsList);
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
        .select('id, first_name, last_name, email')
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

    if (error) alert("Request already exists.");
    else alert("Request sent!");
  };

  const updateRequestStatus = async (requestId, newStatus) => {

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
      fetchFriends();

      if (newStatus === 'accepted')
        setShowLeaderboard(true);
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">

      <DashboardNav />

      <div className="dashboard-content">

        <div className="sharing-page-container">

          {showLeaderboard ? (

            <div className="leaderboard-wrapper">

              <div className="lb-header">
                <button className="lb-icon-btn" onClick={() => setShowLeaderboard(false)}>
                  <FiArrowLeft size={28} />
                </button>

                <input className="lb-search-bar" placeholder="Search friend" />

                <button className="lb-icon-btn"
                  onClick={() => {
                    setShowLeaderboard(false);
                    setIsSearching(true);
                  }}>
                  <FiUserPlus size={28} />
                </button>
              </div>

            </div>

          ) : (

            <div className="sharing-onboarding-wrapper">

              {!isSearching ? (

                <>
                  <div className="avatar-group">
                    <img src={avatar1} className="sharing-avatar side-avatar" />
                    <img src={avatar2} className="sharing-avatar middle-avatar" />
                    <img src={avatar3} className="sharing-avatar side-avatar" />
                  </div>

                  <h1 className="sharing-title">Health Sharing</h1>

                  <p className="sharing-subtitle">
                    Invite your friends to join the fun and start sharing.
                    The more you participate, the higher you climb on the leaderboard.
                  </p>

                  <div className="sharing-features-grid">

                    <div className="feature-item">
                      <FiCheckCircle size={36} color="#E64A45" />
                      <div>
                        <h3>Stay in charge</h3>
                        <p>
                          Keep friends and family up to date on how you’re doing
                          by securely sharing your health data.
                        </p>
                      </div>
                    </div>

                    <div className="feature-item">
                      <FiLock size={36} color="#E64A45" />
                      <div>
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

                <div className="inline-search-section">

                  <div className="search-header">
                    <h3>Find and Approve Friends</h3>

                    <button onClick={() => setIsSearching(false)}>
                      <FiX size={24} />
                    </button>
                  </div>

                  <input
                    className="theme-search-input"
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="results-container">

                    {searchResults.map(u => (

                      <div key={u.id} className="theme-card">

                        <div className="user-info-row">
                          <FiUser />
                          <span>{u.first_name} {u.last_name}</span>
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