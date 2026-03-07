import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX } from 'react-icons/fi';
import { supabase } from '../../supabase'; // Make sure this path is correct!

// Import the Navigation Bar
import DashboardNav from '../../components/DashboardNav'; 

// Import your avatar images
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  // --- NEW: Modal & Search State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- NEW: Search Supabase as the user types ---
  useEffect(() => {
    const fetchUsers = async () => {
      // Don't search until they've typed at least 2 characters
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      // Query the 'profiles' table for emails matching the search term
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, avatar_url')
        .ilike('email', `%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error("Error searching users:", error);
      } else if (data) {
        setSearchResults(data);
      }
    };

    // Debounce the search so it doesn't spam your database on every keystroke
    const delaySearch = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // --- NEW: Send Friend Request ---
  const handleSendRequest = async (receiverId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("You must be logged in!");
        return;
    }

    // Insert a new row into your friend_requests table
    const { error } = await supabase
      .from('friend_requests')
      .insert([
        { sender_id: user.id, receiver_id: receiverId, status: 'pending' }
      ]);

    if (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. You might have already invited them!");
    } else {
      alert("Friend request sent!");
      setIsModalOpen(false); // Close modal on success
      setSearchTerm('');     // Reset search
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      
      <DashboardNav />
      
      <div className="dashboard-content">
        
        <div className="sharing-page-container">
          
          <div className="sharing-onboarding-wrapper">
            
            <div className="avatar-group">
                <img src={avatar1} alt="Avatar 1" className="sharing-avatar side-avatar" />
                <img src={avatar2} alt="Avatar 2" className="sharing-avatar middle-avatar" />
                <img src={avatar3} alt="Avatar 3" className="sharing-avatar side-avatar" />
            </div>

            <h1 className="sharing-title">Health Sharing</h1>
            <p className="sharing-subtitle">
              Invite your friends to join the fun and start sharing. The more you<br />
              participate, the higher you climb on the leader board.
            </p>

            <div className="sharing-features-grid">
                
                <div className="feature-item">
                    <div className="feature-icon">
                        <FiCheckCircle size={36} color="#E64A45" />
                    </div>
                    <div className="feature-text">
                        <h3>Stay in charge</h3>
                        <p>Keep friends and family up to date on how you're doing by securely sharing your Health data.</p>
                    </div>
                </div>

                <div className="feature-item">
                    <div className="feature-icon">
                        <FiLock size={36} color="#E64A45" />
                    </div>
                    <div className="feature-text">
                        <h3>Private and Secure</h3>
                        <p>Only a summary is shared, not detailed information. All data is encrypted and you can stop sharing anytime.</p>
                    </div>
                </div>

            </div>

            {/* THE FIX: Added onClick to open the modal */}
            <button className="share-cta-btn" onClick={() => setIsModalOpen(true)}>
                Share with Someone
            </button>

          </div>

        </div>

      </div>

      {/* --- NEW: Share Modal Overlay --- */}
      {isModalOpen && (
        <div className="share-modal-overlay">
          <div className="share-modal-content">
            
            {/* Modal Header */}
            <div className="share-modal-header">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <FiX size={32} />
              </button>
              <h2>Share With</h2>
              <div style={{ width: 32 }}></div> {/* Spacer to perfectly center the title */}
            </div>

            {/* Search Input */}
            <input 
              type="text" 
              className="share-search-input" 
              placeholder="Search email" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Search Results List */}
            <div className="share-results-list">
              {searchTerm.length > 0 && searchResults.length === 0 ? (
                 <p className="no-results-text">No users found.</p>
              ) : (
                 searchResults.map((resultUser) => (
                   <div 
                      key={resultUser.id} 
                      className="share-result-item"
                      onClick={() => handleSendRequest(resultUser.id)}
                   >
                     {/* If they have an avatar, use it. Otherwise, use a white circle */}
                     {resultUser.avatar_url ? (
                        <img src={resultUser.avatar_url} alt="avatar" className="result-avatar" />
                     ) : (
                        <div className="result-avatar-placeholder"></div>
                     )}
                     <span className="result-email">{resultUser.email}</span>
                   </div>
                 ))
              )}

              {/* Show dummy data exactly like Figma if they haven't started typing yet */}
              {searchTerm.length === 0 && (
                 <>
                   <div className="share-result-item" onClick={() => alert('Search above to add friends!')}>
                     <div className="result-avatar-placeholder"></div>
                     <span className="result-email">chloe@gmail.com</span>
                   </div>
                   <div className="share-result-item" onClick={() => alert('Search above to add friends!')}>
                     <div className="result-avatar-placeholder"></div>
                     <span className="result-email">apple@gmail.com</span>
                   </div>
                   <div className="share-result-item" onClick={() => alert('Search above to add friends!')}>
                     <div className="result-avatar-placeholder"></div>
                     <span className="result-email">jason@yahoo.co.uk</span>
                   </div>
                 </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Sharing;