import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiUser } from 'react-icons/fi';
import { supabase } from '../../supabase'; 

// Import the Navigation Bar
import DashboardNav from '../../components/DashboardNav'; 

// Import your avatar images
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  // Toggle between onboarding and searching
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Search Supabase as the user types
  useEffect(() => {
    const fetchUsers = async () => {
      // Wait for at least 2 characters to avoid fetching the whole database
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      // Query the 'profiles' table for name or email
      // Change 'name' to 'full_name' or 'username' if your DB uses a different column!
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error("Error searching users:", error);
      } else if (data) {
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
      alert("Failed to send request. You might have already invited them!");
    } else {
      alert("Friend request sent!");
      setIsSearching(false); // Close search view on success
      setSearchTerm('');
    }
  };

  return (
    <div className="dashboard-wrapper sharing-page-bg">
      
      <DashboardNav />
      
      <div className="dashboard-content">
        
        <div className="sharing-page-container">
          
          <div className="sharing-onboarding-wrapper">
            
            {/* Avatars stay at the top */}
            <div className="avatar-group">
                <img src={avatar1} alt="Avatar 1" className="sharing-avatar side-avatar" />
                <img src={avatar2} alt="Avatar 2" className="sharing-avatar middle-avatar" />
                <img src={avatar3} alt="Avatar 3" className="sharing-avatar side-avatar" />
            </div>

            <h1 className="sharing-title">Health Sharing</h1>

            {/* Toggle between Onboarding Features OR Inline Search */}
            {!isSearching ? (
                <>
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

                    <button className="share-cta-btn" onClick={() => setIsSearching(true)}>
                        Share with Someone
                    </button>
                </>
            ) : (
                /* --- INLINE SEARCH INTERFACE --- */
                <div className="inline-search-section">
                    
                    <div className="search-header">
                        <h3>Find Friends</h3>
                        <button 
                            className="cancel-search-btn" 
                            onClick={() => { setIsSearching(false); setSearchTerm(''); }}
                        >
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
                        
                        {/* Empty States */}
                        {searchTerm.length === 0 && (
                            <p className="no-results-text">Type a name or email to find friends.</p>
                        )}
                        {searchTerm.length > 0 && searchResults.length === 0 && (
                            <p className="no-results-text">No users found.</p>
                        )}

                        {/* Search Results */}
                        {searchResults.map((resultUser) => (
                            <div key={resultUser.id} className="inline-result-item">
                                <div className="result-user-info">
                                    {resultUser.avatar_url ? (
                                        <img src={resultUser.avatar_url} alt="avatar" className="result-avatar" />
                                    ) : (
                                        <div className="result-avatar-placeholder">
                                            <FiUser size={24} color="#ccc" />
                                        </div>
                                    )}
                                    <div className="result-text-block">
                                        <span className="result-name">{resultUser.name || 'Unknown User'}</span>
                                        <span className="result-email">{resultUser.email}</span>
                                    </div>
                                </div>
                                <button className="send-request-btn" onClick={() => handleSendRequest(resultUser.id)}>
                                    Add
                                </button>
                            </div>
                        ))}

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