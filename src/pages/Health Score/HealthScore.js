import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiHeart, FiMoon, FiActivity, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';

// ✅ Import Navigation Bar
import DashboardNav from '../../components/DashboardNav';

import './HealthScore.css';

const HealthScore = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  // State for real data
  const [stats, setStats] = useState({
    heartRate: 0,
    sleepSeconds: 0,
    calories: 0,
    water: 0,
    score: 0
  });

  // SVG Donut Chart Configuration
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Fetch Latest Profile Stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('heart_rate, sleep_seconds, water_intake')
        .eq('id', user.id)
        .single();

      // 2. Fetch Today's Activity (Calories)
      const { data: activity } = await supabase
        .from('activity_logs')
        .select('calories')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      const heart = profile?.heart_rate || 0;
      const sleep = profile?.sleep_seconds || 0;
      const water = profile?.water_intake || 0;
      const cals = activity?.calories || 0;

      // 3. Simple Health Score Logic (Example: Weighted average out of 100)
      // You can adjust these targets as needed
      const sleepScore = Math.min((sleep / (8 * 3600)) * 25, 25); // Target 8 hrs
      const waterScore = Math.min((water / 2.5) * 25, 25);        // Target 2.5L
      const activityScore = Math.min((cals / 500) * 25, 25);      // Target 500 kcal
      const hrScore = heart > 60 && heart < 100 ? 25 : 15;        // Simple HR check
      
      const totalScore = Math.round(sleepScore + waterScore + activityScore + hrScore);

      setStats({
        heartRate: heart,
        sleepSeconds: sleep,
        calories: cals,
        water: water,
        score: totalScore || 0
      });

    } catch (err) {
      console.error("Error syncing health score:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return (
    <div className="dashboard-wrapper hs-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="hs-page-container">
          {/* Header */}
          <div className="hs-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>Today, {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
            <div className="date-picker-wrapper">
              <FiCalendar size={20} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="hidden-date-input"
              />
            </div>
          </div>

          <div className="hs-content">
            
            {/* LEFT COLUMN: Donut Chart & Legend */}
            <div className="hs-left-col">
              <div className="hs-donut-container">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="hs-donut-svg">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth="8" />
                  
                  {/* Dynamic Progress Segment */}
                  <circle cx="50" cy="50" r={radius} 
                    fill="transparent" 
                    stroke="#FF3B30" 
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (stats.score / 100) * circumference}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="hs-donut-text">{loading ? "..." : `${stats.score}%`}</div>
              </div>

              <div className="hs-legend-grid">
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-red"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Heart Rate</span>
                    <span className="hs-legend-desc">{stats.heartRate > 0 ? "Steady as Sauce" : "Waiting for data"}</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-yellow"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Calories Burned</span>
                    <span className="hs-legend-desc">Simmering</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-orange"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Sleep Hours</span>
                    <span className="hs-legend-desc">Snooze approved</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-pink"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Water Intake</span>
                    <span className="hs-legend-desc">Hydrated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Metric Pills */}
            <div className="hs-right-col">
              <div className="hs-big-pill pill-red" onClick={() => navigate('/heart-rate')}>
                <div className="hs-icon-circle"><FiHeart size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Heart Rate</span>
                  <span className="hs-pill-value">{stats.heartRate || '--'} <strong>BPM</strong></span>
                </div>
              </div>

              <div className="hs-big-pill pill-orange" onClick={() => navigate('/sleep')}>
                <div className="hs-icon-circle"><FiMoon size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Sleep Hours</span>
                  <span className="hs-pill-value">
                    {stats.sleepSeconds > 0 
                      ? (stats.sleepSeconds / 3600).toFixed(1) 
                      : '0.0'} 
                    <strong> hours</strong>
                  </span>
                </div>
              </div>

              <div className="hs-big-pill pill-yellow" onClick={() => navigate('/activity')}>
                <div className="hs-icon-circle"><FiActivity size={24} color="#000" /></div>
                <div className="hs-pill-text text-black">
                  <span className="hs-pill-label">Calories Burned</span>
                  <span className="hs-pill-value">{stats.calories || '0'} <strong>KCAL</strong></span>
                </div>
              </div>

              <div className="hs-big-pill pill-blue" onClick={() => navigate('/water')}>
                <div className="hs-icon-circle"><FiDroplet size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Water Intake</span>
                  <span className="hs-pill-value">
                    {stats.water ? (stats.water / 1000).toFixed(1) : '0.0'} 
                    <strong> L</strong>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default HealthScore;