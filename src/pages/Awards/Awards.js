import React from 'react';
import DashboardNav from '../../components/DashboardNav';
import './Awards.css';

// Import your existing award image
import awardsBadge from '../../assets/awards.png';

const Awards = () => {
  // Data for the 12 months. Change 'earned' to true/false to light them up!
  const monthlyData = [
    { name: 'January', earned: true },
    { name: 'February', earned: false },
    { name: 'March', earned: true },
    { name: 'April', earned: false },
    { name: 'May', earned: true },
    { name: 'June', earned: true },
    { name: 'July', earned: false },
    { name: 'August', earned: true },
    { name: 'September', earned: true },
    { name: 'October', earned: false },
    { name: 'November', earned: false },
    { name: 'December', earned: false },
  ];

  return (
    <div className="dashboard-wrapper awards-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="awards-page-container">
          {/* Main Fullscreen Achievements Card */}
          <div className="achievements-card">
            
            <h3 className="ac-card-title">Monthly Achievements</h3>
            
            <div className="ac-card-body">
              {/* Left Column: Current Challenge */}
              <div className="ac-left-col">
                <div className="ac-main-badge-wrapper">
                  <img src={awardsBadge} alt="Monthly Mover" className="ac-main-badge" />
                </div>
                
                <h4 className="ac-challenge-title">November Challenge</h4>
                
                <div className="ac-progress-bar">
                  <div className="ac-progress-fill" style={{ width: '60%' }}></div>
                </div>
              </div>

              {/* Right Column: 12-Month Grid */}
              <div className="ac-right-col">
                <div className="ac-grid">
                  {monthlyData.map((month) => (
                    <div key={month.name} className="ac-grid-item">
                      <img 
                        src={awardsBadge} 
                        alt={month.name} 
                        className={month.earned ? 'badge-earned' : 'badge-unearned'} 
                      />
                      <span>{month.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Awards;