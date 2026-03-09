import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiHeart, FiMoon, FiActivity, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';

import './HealthScore.css';

const HealthScore = () => {
  const navigate = useNavigate();
  // State for the calendar picker (Defaults to today)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
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

  const radius = 35;
  const circumference = 2 * Math.PI * radius; 
  const strokeWidth = 14; 

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Check if the selected date is Today
      const isToday = date === new Date().toISOString().split('T')[0];

      // 2. Fetch Profile (Only accurate for "Today" for HR and Water)
      const { data: profile } = await supabase
        .from('profiles')
        .select('heart_rate, water_intake')
        .eq('id', user.id)
        .single();

      // 3. Fetch Historical Activity Log (Calories) by Date
      const { data: activityLog } = await supabase
        .from('activity_logs')
        .select('calories')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      // 4. Fetch Historical Sleep Log by Date
      const { data: sleepLog } = await supabase
        .from('sleep_logs')
        .select('seconds')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      // Assign data based on the date selected
      const heart = isToday ? (profile?.heart_rate || 0) : 0; 
      const water = isToday ? (profile?.water_intake || 0) : 0; 
      const cals = activityLog?.calories || 0;
      const sleep = sleepLog?.seconds || 0;

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
  }, [date]); // Re-runs every time the 'date' changes!

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // ==========================================
  // 🎨 RING SVG CALCULATIONS (NO EMPTY SPACE)
  // ==========================================
  const totalAchieved = stats.hrContrib + stats.sleepContrib + stats.calContrib + stats.waterContrib;
  const safeTotal = totalAchieved > 0 ? totalAchieved : 1; 

  const hrLen = (stats.hrContrib / safeTotal) * circumference;
  const sleepLen = (stats.sleepContrib / safeTotal) * circumference;
  const calLen = (stats.calContrib / safeTotal) * circumference;
  const waterLen = (stats.waterContrib / safeTotal) * circumference;

  const hrOffset = 0;
  const sleepOffset = hrLen;
  const calOffset = hrLen + sleepLen;
  const waterOffset = hrLen + sleepLen + calLen;

  return (
    <div className="dashboard-wrapper hs-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="hs-page-container">
          {/* Header & Calendar */}
          <div className="hs-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>
              {date === new Date().toISOString().split('T')[0] ? "Today, " : ""}
              {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            <div className="date-picker-wrapper">
              <FiCalendar size={20} />
              {/* This input drives the date state and updates the whole page automatically */}
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                max={new Date().toISOString().split('T')[0]} // Prevents picking future dates
                className="hidden-date-input"
              />
            </div>
          </div>

          <div className="hs-content">
            
            {/* LEFT COLUMN: Donut Chart & Legend */}
            <div className="hs-left-col">
              <div className="hs-donut-container" style={{ position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="hs-donut-svg">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth={strokeWidth} />
                  
                  {stats.hrContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#EF473A" strokeWidth={strokeWidth}
                      strokeDasharray={`${hrLen} ${circumference}`} strokeDashoffset={-hrOffset} transform="rotate(-90 50 50)" />
                  )}
                  {stats.sleepContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F7931E" strokeWidth={strokeWidth}
                      strokeDasharray={`${sleepLen} ${circumference}`} strokeDashoffset={-sleepOffset} transform="rotate(-90 50 50)" />
                  )}
                  {stats.calContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#FDE08B" strokeWidth={strokeWidth}
                      strokeDasharray={`${calLen} ${circumference}`} strokeDashoffset={-calOffset} transform="rotate(-90 50 50)" />
                  )}
                  {stats.waterContrib > 0 && (
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#4A90E2" strokeWidth={strokeWidth}
                      strokeDasharray={`${waterLen} ${circumference}`} strokeDashoffset={-waterOffset} transform="rotate(-90 50 50)" />
                  )}
                </svg>
                
                {/* Score Text properly centered */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#DE4B4E'
                }}>
                  {loading ? "..." : `${stats.score}`}
                </div>
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