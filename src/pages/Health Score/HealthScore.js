import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiHeart, FiMoon, FiActivity, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';

import './HealthScore.css';

const HealthScore = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  // State for real data and individual score contributions
  const [stats, setStats] = useState({
    heartRate: 0,
    sleepSeconds: 0,
    calories: 0,
    water: 0,
    score: 0,
    hrContrib: 0,
    sleepContrib: 0,
    calContrib: 0,
    waterContrib: 0
  });

  // SVG Donut Chart Configuration
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91
  const strokeWidth = 14; // Made slightly thicker to look more like a pie-chart ring

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

      // ==========================================
      // 🩺 STEP 1 & 2: CONVERT METRICS TO SCORES (0-100)
      // ==========================================
      
      let hrScore = 0;
      if (heart > 0) {
        if (heart >= 60 && heart <= 80) hrScore = 100;
        else if (heart > 80 && heart <= 100) hrScore = Math.max(0, 100 - (heart - 80) * 2);
        else if (heart > 100) hrScore = Math.max(0, 60 - (heart - 100) * 3);
        else if (heart < 60) hrScore = Math.max(0, 100 - (60 - heart) * 2);
      }

      let sleepScore = 0;
      const sleepHrs = sleep / 3600;
      if (sleepHrs > 0) {
        if (sleepHrs >= 7 && sleepHrs <= 9) sleepScore = 100;
        else sleepScore = Math.max(0, 100 - Math.abs(sleepHrs - 8) * 15);
      }

      let calScore = 0;
      if (cals > 0) calScore = Math.min(100, (cals / 500) * 100);

      let waterScore = 0;
      if (water > 0) {
        const waterLiters = water / 1000; 
        waterScore = Math.min(100, (waterLiters / 2.5) * 100);
      }

      // ==========================================
      // ⚖️ STEP 3: ASSIGN WEIGHTS
      // ==========================================
      const hrContrib = hrScore * 0.35;
      const sleepContrib = sleepScore * 0.25;
      const calContrib = calScore * 0.25;
      const waterContrib = waterScore * 0.15;
      
      const totalScore = Math.round(hrContrib + sleepContrib + calContrib + waterContrib);

      setStats({
        heartRate: heart,
        sleepSeconds: sleep,
        calories: cals,
        water: water,
        score: totalScore,
        hrContrib,
        sleepContrib,
        calContrib,
        waterContrib
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

  // ==========================================
  // 🎨 RING SVG CALCULATIONS (NO EMPTY SPACE)
  // Calculate the total combined score to use as the base (100% of the visual ring)
  // ==========================================
  const totalAchieved = stats.hrContrib + stats.sleepContrib + stats.calContrib + stats.waterContrib;
  const safeTotal = totalAchieved > 0 ? totalAchieved : 1; // Prevent division by zero

  // Divide each contribution by the TOTAL achieved so they sum up to exactly 1 (100% of the circle)
  const hrLen = (stats.hrContrib / safeTotal) * circumference;
  const sleepLen = (stats.sleepContrib / safeTotal) * circumference;
  const calLen = (stats.calContrib / safeTotal) * circumference;
  const waterLen = (stats.waterContrib / safeTotal) * circumference;

  // Offsets so the segments stack seamlessly
  const hrOffset = 0;
  const sleepOffset = hrLen;
  const calOffset = hrLen + sleepLen;
  const waterOffset = hrLen + sleepLen + calLen;

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
                  {/* Background Track (Only visible if the user has absolutely 0 data) */}
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth={strokeWidth} />
                  
                  {/* Segment 1: RED (Heart Rate) */}
                  {stats.hrContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#EF473A" strokeWidth={strokeWidth}
                      strokeDasharray={`${hrLen} ${circumference}`} 
                      strokeDashoffset={-hrOffset} 
                      transform="rotate(-90 50 50)" 
                    />
                  )}

                  {/* Segment 2: ORANGE (Sleep) */}
                  {stats.sleepContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F7931E" strokeWidth={strokeWidth}
                      strokeDasharray={`${sleepLen} ${circumference}`} 
                      strokeDashoffset={-sleepOffset} 
                      transform="rotate(-90 50 50)" 
                    />
                  )}

                  {/* Segment 3: YELLOW (Calories) */}
                  {stats.calContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#FDE08B" strokeWidth={strokeWidth}
                      strokeDasharray={`${calLen} ${circumference}`} 
                      strokeDashoffset={-calOffset} 
                      transform="rotate(-90 50 50)" 
                    />
                  )}

                  {/* Segment 4: BLUE (Water) */}
                  {stats.waterContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#4A90E2" strokeWidth={strokeWidth}
                      strokeDasharray={`${waterLen} ${circumference}`} 
                      strokeDashoffset={-waterOffset} 
                      transform="rotate(-90 50 50)" 
                    />
                  )}
                </svg>
                {/* ❌ Percentage text removed here to leave the center completely blank */}
              </div>

              {/* Legend matching colors */}
              <div className="hs-legend-grid">
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-red" style={{ backgroundColor: '#EF473A' }}></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Heart Rate</span>
                    <span className="hs-legend-desc">{stats.heartRate >= 60 && stats.heartRate <= 80 ? "Steady as Sauce" : "Needs Attention"}</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-orange" style={{ backgroundColor: '#F7931E' }}></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Sleep Hours</span>
                    <span className="hs-legend-desc">{stats.sleepSeconds >= 25200 ? "Snooze approved" : "Catch up on rest"}</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-yellow" style={{ backgroundColor: '#FDE08B' }}></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Calories Burned</span>
                    <span className="hs-legend-desc">{stats.calories >= 300 ? "Simmering" : "Low Activity"}</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-blue" style={{ backgroundColor: '#4A90E2' }}></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Water Intake</span>
                    <span className="hs-legend-desc">{stats.water >= 2000 ? "Hydrated" : "Slightly Low"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Metric Pills */}
            <div className="hs-right-col">
              {/* Heart Rate */}
              <div className="hs-big-pill pill-red" onClick={() => navigate('/heart-rate')} style={{ backgroundColor: '#EF473A', color: 'white' }}>
                <div className="hs-icon-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><FiHeart size={24} color="#FFF" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Heart Rate</span>
                  <span className="hs-pill-value">{stats.heartRate || '--'} <strong style={{ fontWeight: 'normal' }}>BPM</strong></span>
                </div>
              </div>

              {/* Sleep Hours */}
              <div className="hs-big-pill pill-orange" onClick={() => navigate('/sleep')} style={{ backgroundColor: '#F7931E', color: 'white' }}>
                <div className="hs-icon-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><FiMoon size={24} color="#FFF" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Sleep Hours</span>
                  <span className="hs-pill-value">{(stats.sleepSeconds / 3600).toFixed(1)} <strong style={{ fontWeight: 'normal' }}>HOURS</strong></span>
                </div>
              </div>

              {/* Calories Burned */}
              <div className="hs-big-pill pill-yellow" onClick={() => navigate('/activity')} style={{ backgroundColor: '#FDE08B', color: '#333' }}>
                <div className="hs-icon-circle" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}><FiActivity size={24} color="#333" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label" style={{ color: '#555' }}>Calories Burned</span>
                  <span className="hs-pill-value">{stats.calories || '0'} <strong style={{ fontWeight: 'normal' }}>KCAL</strong></span>
                </div>
              </div>

              {/* Water Intake */}
              <div className="hs-big-pill pill-blue" onClick={() => navigate('/water')} style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                <div className="hs-icon-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><FiDroplet size={24} color="#FFF" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Water Intake</span>
                  <span className="hs-pill-value">{stats.water ? (stats.water / 1000).toFixed(1) : '0.0'} <strong style={{ fontWeight: 'normal' }}>L</strong></span>
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