import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMoon, FiClock, FiCalendar } from 'react-icons/fi';
import { supabase } from '../../supabase';
import DashboardNav from '../../components/DashboardNav';
import './Sleep.css';

const Sleep = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sleepSeconds, setSleepHours] = useState(0);
  const [sleepHistory, setSleepHistory] = useState([]);
  
  const GOAL_HOURS = 8;

  const fetchSleepData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Fetch Today's Sleep from Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('sleep_seconds')
        .eq('id', user.id)
        .single();
      
      setSleepHours(profile?.sleep_seconds || 0);

      // Fetch Last 7 Days of Sleep Logs
      const { data: logs } = await supabase
        .from('sleep_logs')
        .select('date, seconds')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      if (logs) setSleepHistory(logs);

    } catch (err) {
      console.error("Error fetching sleep data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData]);

  const hoursSlept = (sleepSeconds / 3600).toFixed(1);
  const progressPercentage = Math.min((hoursSlept / GOAL_HOURS) * 100, 100);

  return (
    <div className="dashboard-wrapper detail-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="detail-page-container">
          <div className="detail-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>Sleep Analysis</h2>
            <div style={{ width: 24 }}></div> {/* Spacer for alignment */}
          </div>

          {loading ? (
            <div className="loading-state">Loading sleep data...</div>
          ) : (
            <div className="detail-content">
              
              {/* Hero Card */}
              <div className="hero-card bg-orange">
                <div className="hero-icon-wrapper">
                  <FiMoon size={40} color="#FFF" />
                </div>
                <div className="hero-text">
                  <h3>Time in Bed</h3>
                  <div className="hero-value">
                    {hoursSlept} <span>HOURS</span>
                  </div>
                  <p>Goal: {GOAL_HOURS} hours</p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="card progress-card">
                <div className="card-header">
                  <h3>Daily Goal</h3>
                  <span className="goal-percentage">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill fill-orange" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="progress-subtitle">
                  {hoursSlept >= GOAL_HOURS 
                    ? "Great job! You hit your sleep goal." 
                    : `You need ${(GOAL_HOURS - hoursSlept).toFixed(1)} more hours to reach your goal.`}
                </p>
              </div>

              {/* History Section */}
              <div className="card history-card">
                <div className="card-header">
                  <h3><FiCalendar className="mr-2"/> Last 7 Days</h3>
                </div>
                <div className="history-list">
                  {sleepHistory.length === 0 ? (
                    <p className="no-data">No sleep history found.</p>
                  ) : (
                    sleepHistory.map((log, index) => {
                      const logHours = (log.seconds / 3600).toFixed(1);
                      return (
                        <div key={index} className="history-item">
                          <div className="history-date">
                            {new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="history-value-wrapper">
                            <span className="history-value">{logHours} hrs</span>
                            <div className="mini-bar-track">
                              <div 
                                className="mini-bar-fill bg-orange"
                                style={{ width: `${Math.min((logHours / GOAL_HOURS) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sleep;