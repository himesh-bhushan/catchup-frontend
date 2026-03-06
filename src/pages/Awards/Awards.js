import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import DashboardNav from '../../components/DashboardNav';
import './Awards.css';

// Import all your award images
import awardsBadge from '../../assets/awards.png';
import awardsBadge2 from '../../assets/awards2.png';
import awardsBadge3 from '../../assets/awards3.png';

const Awards = () => {
  const navigate = useNavigate();

  // Data for the 12 months.
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

  // Data for the bottom milestone awards using your new images!
  const milestoneAwards = [
    { id: 1, title: '5 days workout-streak', image: awardsBadge, earned: true },
    { id: 2, title: 'Rank #1 in LeaderBoard for 5 times', image: awardsBadge2, earned: false },
    { id: 3, title: 'Invite 5 friends', image: awardsBadge3, earned: true },
  ];

  return (
    <div className="dashboard-wrapper awards-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="awards-page-container">
          
          {/* Page Header */}
          <div className="awards-header-top">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={28} />
            </button>
            <h2>Awards</h2>
          </div>

          {/* Main Achievements Card */}
          <div className="achievements-card">
            <div className="ac-card-body">
              
              {/* Left Column: Title + Current Challenge */}
              <div className="ac-left-col">
                <h3 className="ac-card-title">Monthly Achievements</h3>
                
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

          {/* Milestone Awards Section */}
          <div className="milestone-awards-container">
            {milestoneAwards.map((award) => (
              <div key={award.id} className="milestone-item">
                <img 
                  src={award.image} 
                  alt={award.title} 
                  className={award.earned ? 'badge-earned' : 'badge-unearned'} 
                />
                <span>{award.title}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Awards;