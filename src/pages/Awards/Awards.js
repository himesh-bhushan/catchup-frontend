import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { supabase } from '../../supabase';
import DashboardNav from '../../components/DashboardNav';
import './Awards.css';

// Import all your award images
import awardsBadge from '../../assets/awards.png';
import awardsBadge2 from '../../assets/awards2.png';
import awardsBadge3 from '../../assets/awards3.png';

const Awards = () => {
  const navigate = useNavigate();

  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isCurrentMonthEarned, setIsCurrentMonthEarned] = useState(false);
  
  const [milestoneAwards, setMilestoneAwards] = useState([
    { id: 1, title: '5 days workout-streak', image: awardsBadge, earned: false },
    { id: 2, title: 'Rank #1 in LeaderBoard for 5 times', image: awardsBadge2, earned: false }, // Placeholder for future DB
    { id: 3, title: 'Invite 5 friends', image: awardsBadge3, earned: false }, // Placeholder for future DB
  ]);

  // --- DATA FETCHING & LOGIC ---
  const fetchAwardsData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Get user's calorie goal
      const { data: profile } = await supabase.from('profiles').select('calorie_goal').eq('id', user.id).single();
      const goal = profile?.calorie_goal || 500;

      // 2. Setup Date Variables
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthIndex = today.getMonth(); // 0-11
      const currentDay = today.getDate();
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentMonthName(monthNames[currentMonthIndex]);

      // 3. Fetch Activity Logs for the ENTIRE current year
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('date, calories')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-01-01`); // Everything from Jan 1st

      const newMonthlyData = monthNames.map(name => ({ name, earned: false }));
      const monthlyMetDays = new Array(12).fill(0);
      const uniqueDays = new Set();
      let maxStreak = 0;

      if (logs) {
        // Process logs into months and count valid goal days
        logs.forEach(log => {
          if (log.calories >= goal && !uniqueDays.has(log.date)) {
            uniqueDays.add(log.date);
            const month = parseInt(log.date.split('-')[1], 10) - 1; // Extract month safely
            monthlyMetDays[month]++;
          }
        });

        // Evaluate Months
        for (let i = 0; i < 12; i++) {
          const daysInMonth = new Date(currentYear, i + 1, 0).getDate();
          if (i < currentMonthIndex) {
             // Past months: Must have hit goal every day of that month
            newMonthlyData[i].earned = monthlyMetDays[i] >= daysInMonth;
          } else if (i === currentMonthIndex) {
            // Current month: Must have hit goal every day up to TODAY
            const isEarned = monthlyMetDays[i] >= currentDay;
            newMonthlyData[i].earned = isEarned;
            setIsCurrentMonthEarned(isEarned);
            setProgressPercentage(Math.min((monthlyMetDays[i] / currentDay) * 100, 100));
          } else {
            // Future months
            newMonthlyData[i].earned = false;
          }
        }

        // Calculate 5-Day Workout Streak for Milestones
        const sortedMetDates = Array.from(uniqueDays).sort();
        let currentStreak = 0;
        for (let i = 0; i < sortedMetDates.length; i++) {
          if (i === 0) { currentStreak = 1; maxStreak = 1; continue; }
          
          const prevDate = new Date(sortedMetDates[i-1]);
          const currDate = new Date(sortedMetDates[i]);
          const diffTime = Math.abs(currDate - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }
      }

      setMonthlyData(newMonthlyData);

      // Update Milestone 1 with actual streak data
      setMilestoneAwards(prev => {
        const newAwards = [...prev];
        newAwards[0].earned = maxStreak >= 5;
        return newAwards;
      });

    } catch (err) {
      console.error("Error fetching awards data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAwardsData();
  }, [fetchAwardsData]);

  // --- NATIVE SOCIAL SHARING ---
  const handleShare = async () => {
    const shareData = {
      title: 'Monthly Mover Award!',
      text: `I just unlocked the '${currentMonthName} Mover' badge on CatchUp for completing my activity ring every single day! 🍅💪 Catch up with me!`,
      url: 'https://catchup.page',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support native sharing
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Award text copied to clipboard! Paste it on social media to share.");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

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

          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>Calculating achievements...</div>
          ) : (
            <>
              {/* Main Achievements Card */}
              <div className="achievements-card">
                <div className="ac-card-body">
                  
                  {/* Left Column: Title + Current Challenge */}
                  <div className="ac-left-col">
                    <h3 className="ac-card-title">Monthly Achievements</h3>
                    
                    <div className="ac-main-badge-wrapper">
                      <img 
                        src={awardsBadge} 
                        alt="Monthly Mover" 
                        className={`ac-main-badge ${isCurrentMonthEarned ? '' : 'grayscale'}`} 
                        style={!isCurrentMonthEarned ? { filter: 'grayscale(100%) opacity(0.5)' } : {}}
                      />
                    </div>
                    
                    <h4 className="ac-challenge-title">{currentMonthName} Challenge</h4>
                    
                    <div className="ac-progress-bar">
                      <div className="ac-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    {/* NEW: Dynamic Share Button */}
                    {isCurrentMonthEarned && (
                      <button 
                        onClick={handleShare}
                        style={{
                          marginTop: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: '#DE4B4E',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          boxShadow: '0 4px 10px rgba(222, 75, 78, 0.3)',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        <FiShare2 size={18} /> Share Award
                      </button>
                    )}
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
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Awards;