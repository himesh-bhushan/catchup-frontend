import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { supabase } from '../../supabase'; 
import './Activity.css';

const Activity = () => {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Stores raw DB rows: [ { date: '2025-02-07', steps: 5000... }, ... ]
  const [activityLogs, setActivityLogs] = useState([]); 
  const [weeklyData, setWeeklyData] = useState([]);
  
  // Display Stats
  const [dailyStats, setDailyStats] = useState(null);

  // Goal State
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState(500);
  const [currentGoal, setCurrentGoal] = useState(500);
  const [userId, setUserId] = useState(null);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // A. Fetch Goal from Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('calorie_goal')
      .eq('id', user.id)
      .single();
    
    if (profile?.calorie_goal) {
      setCurrentGoal(profile.calorie_goal);
      setNewGoal(profile.calorie_goal);
    }

    // B. Fetch Activity Logs (Last 30 days to be safe)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (!error && logs) {
      setActivityLogs(logs);
    }
  };

  // --- 2. CALCULATE STATS WHENEVER DATE/LOGS/GOAL CHANGE ---
  useEffect(() => {
    // 1. Build Weekly Sidebar Data
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday start
    
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        week.push(generateStatsForDate(d)); // Generate data for each day of week
    }
    setWeeklyData(week);

    // 2. Set Main Display Data
    setDailyStats(generateStatsForDate(selectedDate));
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activityLogs, currentGoal]);


  // Helper: Look up DB data for a specific date object
  const generateStatsForDate = (dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // Find log in our fetched array
    const log = activityLogs.find(l => l.date === dateStr);

    // Default values if no DB entry exists
    const currentCalories = log ? log.calories : 0;
    const steps = log ? log.steps : 0;
    const distance = log ? log.distance : 0;

    // Calculate Percentage
    const percent = currentGoal > 0 ? Math.min(currentCalories / currentGoal, 1) : 0;

    // Simulate hourly history for the chart (DB stores totals, so we distribute for visuals)
    // In a real app, you might store hourly arrays in JSONB
    const fakeHistory = [
      currentCalories * 0.1, 
      currentCalories * 0.2, 
      currentCalories * 0.4, 
      currentCalories * 0.15, 
      currentCalories * 0.1, 
      currentCalories * 0.05
    ];

    const stepHistory = fakeHistory.map(v => v * 1.5); // Roughly correlate steps to cals

    return {
      date: dateObj,
      dayLabel: dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }),
      fullDate: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      calories: { current: currentCalories, goal: currentGoal, history: fakeHistory },
      steps: { current: steps, history: stepHistory },
      distance: distance.toFixed(2),
      percentage: percent 
    };
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate)) setSelectedDate(newDate);
  };

  // --- 3. SAVE NEW GOAL ---
  const handleSaveGoal = async () => {
    if (!userId) return;
    const goalValue = parseInt(newGoal);
    
    if (goalValue > 0) {
        // Optimistic Update
        setCurrentGoal(goalValue);

        // Update Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ calorie_goal: goalValue })
          .eq('id', userId);

        if (error) console.error("Error saving goal:", error);
    }
    setShowModal(false);
  };

  if (!dailyStats) return <div style={{padding: '40px'}}>Loading Activity...</div>;

  return (
    <div className="activity-page-wrapper">
      <header className="activity-header">
        <div className="header-left">
            <button className="back-btn-icon" onClick={() => navigate('/dashboard')}>
                <FiArrowLeft size={28} />
            </button>
            <h2>Today, {dailyStats.fullDate}</h2>
            <div className="calendar-wrapper" onClick={() => dateInputRef.current.showPicker()}>
                <FiCalendar size={20} color="#333" />
                <input type="date" ref={dateInputRef} onChange={handleDateChange} className="hidden-date-input"/>
            </div>
        </div>
      </header>

      <div className="activity-grid">
        {/* SIDEBAR: WEEKLY PROGRESS */}
        <div className="week-sidebar">
            {weeklyData.map((day, index) => {
                const isSelected = day.date.toDateString() === selectedDate.toDateString();
                // Safe check for percentage
                const dashArray = `${Math.min((day.percentage || 0) * 100, 100)}, 100`;
                
                return (
                    <div key={index} className={`day-row ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(day.date)}>
                        <div className="day-letter-box">{day.dayLabel}</div>
                        <div className="mini-ring-wrapper">
                            <svg viewBox="0 0 36 36" className="mini-circular-chart">
                                <circle cx="18" cy="18" r="15.9155" className="mini-circle-bg" />
                                <path 
                                    className="mini-circle" 
                                    strokeDasharray={dashArray} 
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                />
                            </svg>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* MAIN RING SECTION */}
        <div className="main-ring-section">
            <div className="large-ring-container">
                 <svg viewBox="0 0 36 36" className="large-circular-chart">
                    <circle cx="18" cy="18" r="15.9155" className="circle-bg" />
                    <path 
                        className="circle" 
                        strokeDasharray={`${Math.min(dailyStats.percentage * 100, 100)}, 100`} 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                 </svg>
                 {/* Visual icon inside ring */}
                 <div className="ring-arrow-overlay"><FiArrowRight color="white" size={24} /></div>
            </div>
            <button className="change-goal-btn" onClick={() => setShowModal(true)}>Change Goal</button>
        </div>

        {/* STATS & GRAPHS */}
        <div className="stats-graphs-section">
            
            {/* Calories Card */}
            <div className="stat-block">
                <h3>Move</h3>
                <div className="stat-highlight">
                    <span className="big-num red-text">{dailyStats.calories.current}</span>
                    <span className="sub-text">/{dailyStats.calories.goal} KCAL</span>
                </div>
                <div className="chart-outer-wrapper">
                    <div className="grid-lines"><div className="grid-line"></div><div className="grid-line"></div><div className="grid-line"></div></div>
                    <div className="bar-chart-container">
                        {dailyStats.calories.history.map((val, i) => (
                            <div key={i} className="bar-wrapper">
                                {/* Visual cap at 100% height */}
                                <div className="bar-fill" style={{height: `${Math.min((val / (dailyStats.calories.goal / 5)) * 100, 100)}%`}}></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="chart-labels"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span></div>
            </div>

            {/* Steps & Distance Card */}
            <div className="stat-block">
                <div className="dual-stat-header">
                    <div>
                        <h3>Steps</h3>
                        <span className="big-num black-text">{dailyStats.steps.current}</span>
                    </div>
                    <div>
                        <h3>Distance</h3>
                        <span className="big-num black-text">{dailyStats.distance}KM</span>
                    </div>
                </div>
                <div className="chart-outer-wrapper">
                    <div className="grid-lines"><div className="grid-line"></div><div className="grid-line"></div><div className="grid-line"></div></div>
                    <div className="bar-chart-container">
                        {dailyStats.steps.history.map((val, i) => (
                            <div key={i} className="bar-wrapper">
                                <div className="bar-fill" style={{height: `${Math.min(val / 500 * 100, 100)}%`, opacity: 0.8}}></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="chart-labels"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span></div>
            </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Set Daily Calorie Goal</h3>
                <input type="number" className="modal-input" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="btn-save" onClick={handleSaveGoal}>Save</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default Activity;