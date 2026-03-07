import React from 'react';
import { FiLock, FiCheckCircle } from 'react-icons/fi';

// Import the Navigation Bar
import DashboardNav from '../../components/DashboardNav'; 

// Import your avatar images
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

import './Sharing.css';

const Sharing = () => {
  return (
    <div className="dashboard-wrapper sharing-page-bg">
      
      <DashboardNav />
      
      <div className="dashboard-content">
        
        <div className="sharing-page-container">
          
          {/* Centered Onboarding Content */}
          <div className="sharing-onboarding-wrapper">
            
            {/* Overlapping Avatars */}
            <div className="avatar-group">
                <img src={avatar1} alt="Avatar 1" className="sharing-avatar side-avatar" />
                <img src={avatar2} alt="Avatar 2" className="sharing-avatar middle-avatar" />
                <img src={avatar3} alt="Avatar 3" className="sharing-avatar side-avatar" />
            </div>

            {/* Titles */}
            <h1 className="sharing-title">Health Sharing</h1>
            <p className="sharing-subtitle">
              Invite your friends to join the fun and start sharing. The more you<br />
              participate, the higher you climb on the leader board.
            </p>

            {/* Features Grid */}
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

            {/* Big Red Button */}
            <button className="share-cta-btn">
                Share with Someone
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Sharing;