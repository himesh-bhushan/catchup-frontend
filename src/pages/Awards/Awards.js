import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiAward } from 'react-icons/fi';
import { supabase } from '../../supabase';
import DashboardNav from '../../components/DashboardNav';

// Images
import awardsImg from '../../assets/awards.png'; 
import './Awards.css';

const Awards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [daysMet, setDaysMet] = useState(0);
  const [daysPassed, setDaysPassed] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const fetchAwardData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Get Goal
      const { data: profile } = await supabase.from('profiles').select('calorie_goal').eq('id', user.id).single();
      const goal = profile?.calorie_goal || 500;

      // 2. Determine Monthly Progress
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const currentDaysPassed = today.getDate(); 
      setDaysPassed(currentDaysPassed);

      const { data: monthLogs } = await supabase
        .from('activity_logs')
        .select('date, calories')
        .eq('user_id', user.id)
        .gte('date', firstDayOfMonth);

      let achievedDays = 0;
      if (monthLogs) {
        const uniqueDays = new Set();
        monthLogs.forEach(log => {
            if (log.calories >= goal && !uniqueDays.has(log.date)) {
                uniqueDays.add(log.date);
                achievedDays++;
            }
        });
      }

      setDaysMet(achievedDays);
      setIsUnlocked(achievedDays >= currentDaysPassed); // Awarded if hit goal every day so far this month

    } catch (err) {
      console.error("Error fetching award data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAwardData();
  }, [fetchAwardData]);

  // NATIVE SOCIAL SHARING
  const handleShare = async () => {
    const shareData = {
      title: 'Monthly Mover Award!',
      text: `I just unlocked the 'Monthly Mover' badge on CatchUp for completing my activity ring every single day! 🍅💪 Catch up with me!`,
      url: 'https://catchup.page',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop browsers without Web Share API
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Award text copied to clipboard! Paste it on social media to share.");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const progressPercentage = Math.min((daysMet / (daysPassed || 1)) * 100, 100);

  return (
    <div className="dashboard-wrapper detail-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="awards-page-container">
          
          <div className="detail-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>My Awards</h2>
            <div style={{ width: 50 }}></div>
          </div>

          {loading ? (
            <div className="loading-state">Checking your progress...</div>
          ) : (
            <div className="awards-content">
              
              {/* THE BADGE CARD */}
              <div className={`award-hero-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="award-badge-wrapper">
                    <img 
                        src={awardsImg} 
                        alt="Monthly Mover Award" 
                        className={`big-award-image ${isUnlocked ? '' : 'grayscale'}`} 
                    />
                </div>
                <div className="award-info">
                    <h1>Monthly Mover</h1>
                    <p>Complete your Activity Ring every day of the month.</p>
                    
                    <div className="award-status-pill">
                        {isUnlocked ? (
                            <><FiAward /> Award Unlocked</>
                        ) : (
                            "Locked"
                        )}
                    </div>
                </div>
              </div>

              {/* PROGRESS SECTION */}
              <div className="card progress-card">
                <div className="card-header">
                  <h3>Monthly Progress</h3>
                  <span className="goal-percentage">{daysMet} / {daysPassed} Days</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill fill-red" 
                    style={{ width: `${progressPercentage}%`, backgroundColor: '#DE4B4E' }}
                  ></div>
                </div>
                <p className="progress-subtitle">
                  {isUnlocked 
                    ? "Incredible job! You've crushed your goals every single day this month." 
                    : `You've hit your goal ${daysMet} days out of the ${daysPassed} days this month.`}
                </p>
              </div>

              {/* SHARE BUTTON */}
              {isUnlocked && (
                  <button className="share-award-btn" onClick={handleShare}>
                      <FiShare2 size={20} />
                      Share to Social Media
                  </button>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Awards;