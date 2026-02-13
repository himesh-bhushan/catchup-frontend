import React, { useState } from 'react';
// REMOVED: import { useNavigate } from 'react-router-dom'; 
import { FiArrowLeft, FiUserPlus, FiX, FiChevronRight, FiPlusCircle } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa'; 
import DashboardNav from '../../components/DashboardNav';
import './Sharing.css';

const Sharing = () => {
  // Mobile View State
  const [mobileView, setMobileView] = useState('ranking'); 
  
  // Desktop View State: FALSE by default (Hidden Sharing Card)
  const [showDesktopSharing, setShowDesktopSharing] = useState(false);

  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // --- Mock Data ---
  const leaderboard = [
    { rank: 2, name: 'jane_19', score: 10008, handle: '@jane_19' },
    { rank: 1, name: 'kiki1215', score: 10204, handle: '@kiki1215' }, 
    { rank: 3, name: 'balabala :)', score: 9879, handle: '@balabala :)' },
  ];

  const listRanks = [
    { rank: 4, name: 'jujurara', score: 9764, handle: '@jujurara' },
    { rank: 5, name: '@12345670', score: 8709, handle: '@12345670' },
    { rank: 6, name: 'holyvoly', score: 7999, handle: '@holyvoly' },
    { rank: 7, name: 'molly9999', score: 7860, handle: '@molly9999' },
  ];

  const inviteList = [
    { name: 'kiki1215@gmail.com' },
    { name: 'jujura@gmail.com' },
    { name: 'holyvoly@gmail.com' },
  ];

  const handleInviteClick = (friend) => {
    setSelectedFriend(friend);
    setShowInviteModal(true);
  };

  const handleSendInvite = () => {
    alert(`Invitation sent to ${selectedFriend.name}!`);
    setShowInviteModal(false);
  };

  // Toggle Logic
  const handleAddBtnClick = () => {
    if (window.innerWidth < 1024) {
      setMobileView('sharing');
    } else {
      setShowDesktopSharing(!showDesktopSharing); 
    }
  };

  return (
    <>
      <DashboardNav />

      <div className="sharing-page-wrapper">
        <div className={`content-container ${showDesktopSharing ? 'layout-split' : 'layout-centered'}`}>
          
          {/* ===================================================
              LEFT SECTION: RANKING
          =================================================== */}
          <div className={`ranking-section ${mobileView === 'sharing' ? 'mobile-hidden' : ''}`}>
             
             {/* HEADER: Search Bar + Button (Outside) */}
             <div className="ranking-header-container">
                <div className="header-search-wrapper">
                   <input type="text" placeholder="Search friend" />
                </div>

                <div className="header-action-btn">
                  <button 
                    className={`icon-btn add-btn ${showDesktopSharing ? 'active' : ''}`} 
                    onClick={handleAddBtnClick}
                  >
                     <FiUserPlus size={32} /> {/* Increased Size slightly */}
                     <span className="plus-badge">+</span>
                  </button>
                </div>
             </div>

             {/* Podium */}
             <div className="podium-area">
                 {leaderboard.map((user) => (
                   <div key={user.rank} className={`podium-card rank-${user.rank}`}>
                      <div className="podium-visual">
                         <span className="rank-label">
                            {user.rank === 1 ? '1ST' : user.rank === 2 ? '2ND' : '3RD'}
                         </span>
                         {user.rank === 1 && <FaCrown className="crown-icon" />}
                         <div className="avatar-circle"></div>
                      </div>
                      <div className="podium-text">
                        <span className="score-text pixel-font">{user.score}</span>
                        <span className="handle-text">{user.handle}</span>
                      </div>
                   </div>
                 ))}
             </div>

             {/* Ranking List */}
             <div className="ranking-list">
                 {listRanks.map((user) => (
                   <div key={user.rank} className="list-card">
                      <div className="list-rank-col">
                        <span className="rank-num pixel-font">{user.rank}TH</span>
                        <span className="rank-arrow">▲</span>
                      </div>
                      <div className="list-avatar"></div>
                      <span className="list-handle">{user.handle}</span>
                      <span className="list-score pixel-font">{user.score}</span>
                   </div>
                 ))}
             </div>
          </div>


          {/* ===================================================
              RIGHT SECTION: SHARING CARD
          =================================================== */}
          <div className={`sharing-section ${!showDesktopSharing ? 'desktop-hidden' : ''} ${mobileView === 'ranking' ? 'mobile-hidden' : ''}`}>
             
             <div className="mobile-sharing-nav">
               <button onClick={() => setMobileView('ranking')}><FiArrowLeft size={24}/></button>
             </div>

             <div className="sharing-card">
                <div className="card-header">
                   <FiX className="close-btn" onClick={() => setShowDesktopSharing(false)} /> 
                   <h3>Sharing</h3>
                </div>

                <div className="section-label">Sharing With</div>
                <div className="avatars-row">
                   <div className="avatar-placeholder"></div>
                   <div className="avatar-placeholder"></div>
                </div>

                <div className="invite-container">
                   <div className="invite-header">
                      <span>Invite a Friend</span>
                      <FiPlusCircle className="icon-green" />
                   </div>
                   <div className="invite-scroll-list">
                      {inviteList.map((friend, i) => (
                        <div key={i} className="invite-item" onClick={() => handleInviteClick(friend)}>
                           <div className="invite-avatar"></div>
                           <span className="invite-name">{friend.name}</span>
                           <FiChevronRight className="icon-grey" />
                        </div>
                      ))}
                   </div>
                   <div className="invite-footer">More....</div>
                </div>
                
                <div className="section-label">Invited</div>
                <div className="avatars-row">
                   <div className="avatar-placeholder small"></div>
                   <div className="avatar-placeholder small"></div>
                </div>
             </div>
          </div>

          {/* Modal */}
          {showInviteModal && selectedFriend && (
             <div className="modal-overlay">
               <div className="modal-box">
                  <h3>Are you sure you'd like to send this invitation?</h3>
                  <div className="modal-actions">
                     <button className="modal-btn send" onClick={handleSendInvite}>Send</button>
                     <button className="modal-btn cancel" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  </div>
               </div>
             </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Sharing;