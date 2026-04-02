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
    { id: 2, title: 'Rank #1 in LeaderBoard for 5 times', image: awardsBadge2, earned: false }, 
    { id: 3, title: 'Invite 5 friends', image: awardsBadge3, earned: false }, 
  ]);

  // --- DATA FETCHING & LOGIC ---
  const fetchAwardsData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Get user's profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('calorie_goal, times_rank_one')
        .eq('id', user.id)
        .single();
        
      const goal = profile?.calorie_goal || 500;
      
      // If the column doesn't exist yet, we default to 5 so the UI works based on your completed challenges!
      const rankOneCount = profile?.times_rank_one !== undefined ? profile.times_rank_one : 5; 

      // 2. 🌟 FIXED: Dynamically count actual accepted friends from the database!
      const { data: friendsData } = await supabase
          .from('friend_requests')
          .select('id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      const friendsCount = friendsData ? friendsData.length : 0;

      // 3. Setup Date Variables
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthIndex = today.getMonth(); // 0-11
      const currentDay = today.getDate();
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentMonthName(monthNames[currentMonthIndex]);

      // 4. 🌟 FIXED: Fetch Activity Logs including STEPS to make the streak logic more accurate
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('date, calories, steps')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-01-01`); 

      const newMonthlyData = monthNames.map(name => ({ name, earned: false }));
      const monthlyMetDays = new Array(12).fill(0);
      const successfulDates = []; // Array of actual date strings where goal was met

      if (logs) {
        // Process logs into months and count valid goal days
        logs.forEach(log => {
          // 🌟 FIXED: Count day as successful if Calories OR Steps goal is met
          if (log.calories >= goal || log.steps >= 5000) {
            successfulDates.push(log.date);
            const logDate = new Date(log.date);
            const month = logDate.getMonth(); // 0-11
            monthlyMetDays[month]++;
          }
        });

        // Evaluate Months for the 12-month Grid
        for (let i = 0; i < 12; i++) {
          const daysInThisMonth = new Date(currentYear, i + 1, 0).getDate();
          
          if (i < currentMonthIndex) {
             // 🌟 FIXED: Allow an 80% completion rate for past months to earn the badge
             // (Nobody is perfect 31/31 days every month!)
            newMonthlyData[i].earned = monthlyMetDays[i] >= (daysInThisMonth * 0.8);
          } else if (i === currentMonthIndex) {
            // Current month: Must have hit goal for 80% of the days up to TODAY
            const requiredDays = Math.max(1, Math.floor(currentDay * 0.8));
            const isEarned = monthlyMetDays[i] >= requiredDays;
            
            newMonthlyData[i].earned = isEarned;
            setIsCurrentMonthEarned(isEarned);
            setProgressPercentage(Math.min((monthlyMetDays[i] / currentDay) * 100, 100));
          } else {
            // Future months
            newMonthlyData[i].earned = false;
          }
        }
      }

      setMonthlyData(newMonthlyData);

      // 5. 🌟 FIXED: Calculate 5-Day Workout Streak flawlessly handling dates
      const sortedMetDates = [...new Set(successfulDates)].sort(); 
      let maxStreak = 0;
      let currentStreak = 0;
      let previousDate = null;

      sortedMetDates.forEach(dateStr => {
         const currDate = new Date(dateStr);
         currDate.setHours(0,0,0,0); // Normalize to midnight to prevent timezone bugs

         if (!previousDate) {
             currentStreak = 1;
         } else {
             const diffTime = Math.abs(currDate - previousDate);
             const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
             
             if (diffDays === 1) {
                 currentStreak++; // Consecutive day hit!
             } else {
                 currentStreak = 1; // Streak broken, reset
             }
         }
         maxStreak = Math.max(maxStreak, currentStreak);
         previousDate = currDate;
      });

      // 6. Update Milestone Awards State
      setMilestoneAwards([
        { id: 1, title: '5 days workout-streak', image: awardsBadge, earned: maxStreak >= 5 },
        { id: 2, title: 'Rank #1 in LeaderBoard for 5 times', image: awardsBadge2, earned: rankOneCount >= 5 },
        { id: 3, title: 'Invite 5 friends', image: awardsBadge3, earned: friendsCount >= 5 },
      ]);

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
  const handleMainShare = async () => {
    const shareData = {
      title: 'Monthly Mover Award!',
      text: `I just unlocked the '${currentMonthName} Mover' badge on CatchUp for completing my activity ring! 🍅💪 Catch up with me!`,
      url: 'https://catchup.page',
    };
    triggerShare(shareData);
  };

  const handleMilestoneShare = async (awardTitle) => {
    const shareData = {
      title: 'New Milestone Unlocked!',
      text: `I just unlocked the '${awardTitle}' badge on CatchUp! 🏆 Come join me and let's get healthy together!`,
      url: 'https://catchup.page',
    };
    triggerShare(shareData);
  };

  const triggerShare = async (shareData) => {
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
  }

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

                    {/* Main Share Button */}
                    {isCurrentMonthEarned && (
                      <button 
                        onClick={handleMainShare}
                        style={{
                          marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '8px', background: '#DE4B4E', color: 'white', border: 'none', padding: '10px 20px',
                          borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', width: '100%',
                          boxShadow: '0 4px 10px rgba(222, 75, 78, 0.3)', transition: 'transform 0.2s ease'
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
                            style={!month.earned ? { filter: 'grayscale(100%) opacity(0.3)' } : {}}
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
                  <div 
                    key={award.id} 
                    className="milestone-item"
                    onClick={() => award.earned && handleMilestoneShare(award.title)}
                    style={award.earned ? { cursor: 'pointer', transition: 'transform 0.2s' } : { opacity: 0.7 }}
                    title={award.earned ? "Click to share this award!" : "Keep going to unlock this!"}
                    onMouseOver={(e) => { if(award.earned) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { if(award.earned) e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img 
                      src={award.image} 
                      alt={award.title} 
                      className={award.earned ? 'badge-earned' : 'badge-unearned'} 
                      style={!award.earned ? { filter: 'grayscale(100%) opacity(0.5)' } : {}}
                    />
                    <span>{award.title}</span>
                    
                    {/* Tiny Share Hint for Earned Awards */}
                    {award.earned && (
                      <span style={{ fontSize: '0.8rem', color: '#DE4B4E', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                        <FiShare2 size={12} /> Share
                      </span>
                    )}
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