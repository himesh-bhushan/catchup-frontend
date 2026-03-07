import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser, FiArrowLeft, FiUserPlus } from 'react-icons/fi';
import { supabase } from '../../supabase'; 

import DashboardNav from '../../components/DashboardNav'; 

import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  // --- STATES ---
  const [isSearching, setIsSearching] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false); // NEW: Controls the leaderboard view
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- DUMMY LEADERBOARD DATA (Matches your Figma!) ---
  const leaderboardData = [
    { rank: 1, name: '@kiki1215', score: '10204' },
    { rank: 2, name: '@jane_19', score: '10008' },
    { rank: 3, name: '@balabala:)', score: '9879' },
    { rank: 4, name: '@jujurara', score: '9764' },
    { rank: 5, name: '@12345670', score: '8709' },
    { rank: 6, name: '@holyvoly', score: '7999' }
  ];

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

      if (!error && data) {
        setSearchResults(data);
      }
    };

    const delaySearch = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("You must be logged in!");
        return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert([
        { sender_id: user.id, receiver_id: receiverId, status: 'pending' }
      ]);

    if (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request.");
    } else {
      // THE FIX: Move from Search -> Leaderboard after inviting!
      setIsSearching(false);
      setSearchTerm('');
      setShowLeaderboard(true); 
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="sharing-page-container">
          
          {/* =========================================
              VIEW 1: THE LEADERBOARD 
              ========================================= */}
          {showLeaderboard ? (
            <div className="leaderboard-wrapper">
              
              {/* Leaderboard Header */}
              <div className="lb-header">
                <button className="lb-icon-btn" onClick={() => setShowLeaderboard(false)}>
                  <FiArrowLeft size={28} />
                </button>
                <input type="text" className="lb-search-bar" placeholder="Search friend" />
                <button className="lb-icon-btn" onClick={() => { setShowLeaderboard(false); setIsSearching(true); }}>
                  <FiUserPlus size={28} />
                </button>
              </div>

              {/* Podium (Top 3) */}
              <div className="lb-podium">
                
                {/* 2nd Place */}
                <div className="podium-col second-place">
                  <span className="podium-rank">2ND</span>
                  <div className="podium-avatar"></div>
                  <span className="podium-score">{leaderboardData[1].score}</span>
                  <span className="podium-name">{leaderboardData[1].name}</span>
                </div>

                {/* 1st Place */}
                <div className="podium-col first-place">
                  <span className="podium-crown">👑</span>
                  <div className="podium-avatar first-avatar"></div>
                  <span className="podium-score first-score">{leaderboardData[0].score}</span>
                  <span className="podium-name">{leaderboardData[0].name}</span>
                </div>

                {/* 3rd Place */}
                <div className="podium-col third-place">
                  <span className="podium-rank">3RD</span>
                  <div className="podium-avatar"></div>
                  <span className="podium-score">{leaderboardData[2].score}</span>
                  <span className="podium-name">{leaderboardData[2].name}</span>
                </div>

              </div>

              {/* The Rest of the List (4th onwards) */}
              <div className="lb-list">
                {leaderboardData.slice(3).map((user) => (
                  <div key={user.rank} className="lb-list-card">
                    <div className="lb-card-left">
                      <div className="lb-card-rank">
                        {user.rank}TH<br/>
                        <span className="rank-up-arrow">▲</span>
                      </div>
                      <div className="lb-card-avatar"></div>
                      <span className="lb-card-name">{user.name}</span>
                    </div>
                    <span className="lb-card-score">{user.score}</span>
                  </div>
                ))}
              </div>

            </div>

          ) : 

          /* =========================================
             VIEW 2: ONBOARDING / SEARCH
             ========================================= */
          (
            <div className="sharing-onboarding-wrapper">
              
              {/* Hide avatars if we are searching to save space */}
              {!isSearching && (
                  <div className="avatar-group">
                      <img src={avatar1} alt="Avatar 1" className="sharing-avatar side-avatar" />
                      <img src={avatar2} alt="Avatar 2" className="sharing-avatar middle-avatar" />
                      <img src={avatar3} alt="Avatar 3" className="sharing-avatar side-avatar" />
                  </div>
              )}

              <h1 className="sharing-title">{!isSearching ? "Health Sharing" : ""}</h1>

              {!isSearching ? (
                  <>
                      <p className="sharing-subtitle">
                          Invite your friends to join the fun and start sharing. The more you<br />
                          participate, the higher you climb on the leader board.
                      </p>

                      <div className="sharing-features-grid">
                          <div className="feature-item">
                              <div className="feature-icon"><FiCheckCircle size={36} color="#E64A45" /></div>
                              <div className="feature-text">
                                  <h3>Stay in charge</h3>
                                  <p>Keep friends and family up to date on how you're doing by securely sharing your Health data.</p>
                              </div>
                          </div>
                          <div className="feature-item">
                              <div className="feature-icon"><FiLock size={36} color="#E64A45" /></div>
                              <div className="feature-text">
                                  <h3>Private and Secure</h3>
                                  <p>Only a summary is shared, not detailed information. All data is encrypted and you can stop sharing anytime.</p>
                              </div>
                          </div>
                      </div>

                      <button className="share-cta-btn" onClick={() => setIsSearching(true)}>
                          Share with Someone
                      </button>

                      {/* TEMPORARY BUTTON: Just to let you view the leaderboard without searching */}
                      <button className="share-cta-btn" style={{marginTop: '20px', background: '#333'}} onClick={() => setShowLeaderboard(true)}>
                          View Leaderboard (Test)
                      </button>
                  </>
              ) : (
                  <div className="inline-search-section">
                      <div className="search-header">
                          <h3>Find Friends</h3>
                          <button className="cancel-search-btn" onClick={() => { setIsSearching(false); setSearchTerm(''); }}>
                              <FiX size={28} />
                          </button>
                      </div>

                      <input 
                          type="text" 
                          className="inline-search-input" 
                          placeholder="Search by name or email..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />

                      <div className="inline-results-list">
                          {searchTerm.length === 0 && <p className="no-results-text">Type a name or email to find friends.</p>}
                          {searchTerm.length > 0 && searchResults.length === 0 && <p className="no-results-text">No users found.</p>}

                          {searchResults.map((resultUser) => (
                              <div key={resultUser.id} className="inline-result-item">
                                  <div className="result-user-info">
                                      <div className="result-avatar-placeholder"><FiUser size={24} color="#ccc" /></div>
                                      <div className="result-text-block">
                                          <span className="result-name">{resultUser.first_name} {resultUser.last_name || ''}</span>
                                          <span className="result-email">{resultUser.email}</span>
                                      </div>
                                  </div>
                                  <button className="send-request-btn" onClick={() => handleSendRequest(resultUser.id)}>Add</button>
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