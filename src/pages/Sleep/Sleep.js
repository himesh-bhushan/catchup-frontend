import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiMoon } from 'react-icons/fi';
import { supabase } from '../../supabase';

// --- Components ---
import DashboardNav from '../../components/DashboardNav';

// --- Styles ---
import './Sleep.css';

const Sleep = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ hours: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newHours, setNewHours] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSleepData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. FETCH LATEST FROM PROFILE
      const { data: profile } = await supabase
        .from('profiles')
        .select('sleep_seconds')
        .eq('id', user.id)
        .single();

      if (profile?.sleep_seconds) {
        setTodayLog({ 
          hours: parseFloat((profile.sleep_seconds / 3600).toFixed(1)), 
          date: new Date().toISOString() 
        });
      }

      // 2. FETCH HISTORY FROM LOGS (For the Graph)
      const { data: history, error: historyError } = await supabase
        .from('sleep_logs')
        .select('hours, seconds, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!historyError && history && history.length > 0) {
        // Map data to ensure we have an 'hours' value
        const formattedHistory = history.map(log => ({
            ...log,
            hours: log.hours ? parseFloat(log.hours) : parseFloat((log.seconds / 3600).toFixed(1))
        }));
        
        setLogs(formattedHistory);

        // Calculate Average
        const totalHours = formattedHistory.reduce((sum, log) => sum + log.hours, 0);
        setAverage((totalHours / formattedHistory.length).toFixed(1));
      }
    } catch (err) {
      console.error("Error fetching Sleep data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData, range]);

  const handleAddReading = async () => {
    if (!newHours) return;

    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];
    const hoursValue = parseFloat(newHours);
    const secondsValue = Math.round(hoursValue * 3600);

    // Update Logs (History)
    const { error: logError } = await supabase
      .from('sleep_logs')
      .upsert({
        user_id: user.id,
        date: todayStr,
        hours: hoursValue,
        seconds: secondsValue
      }, { onConflict: 'user_id,date' });

    // Update Profile (Dashboard)
    const { error: profError } = await supabase
        .from('profiles')
        .update({ sleep_seconds: secondsValue })
        .eq('id', user.id);

    if (!logError && !profError) {
      setIsAdding(false);
      setNewHours('');
      fetchSleepData(); // Refresh UI
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <FiMoon size={40} color="#ccc" />
            <p>No sleep history found. Log your sleep to see trends.</p>
         </div>
       );
    }

    const minVal = 0; 
    const maxVal = 12; // Max range for sleep graph (12 hours)
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

    const points = logs.map((log, i) => `${getX(i)},${getY(log.hours)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="sleep-chart-svg">
        
        {/* Y-Axis Grid Lines */}
        {[2, 4, 6, 8, 10, 12].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="#F0F0F0" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="#BBB" fontFamily="Poppins">{val}h</text>
           </g>
        ))}

        {/* Line */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#F7931E" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots */}
        {logs.map((log, i) => (
          <circle key={i} cx={getX(i)} cy={getY(log.hours)} r="7" fill="#F7931E" stroke="white" strokeWidth="3" />
        ))}

        {/* X-Axis Labels */}
        {logs.map((log, i) => (
          <text key={i} x={getX(i)} y={height + 35} fontSize="14" fill="#999" textAnchor="middle" fontFamily="Poppins">
            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="dashboard-wrapper sleep-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="sleep-page-container">
          
          <div className="sleep-header">
            <button className="sleep-back-btn" onClick={() => navigate('/dashboard')}>
                <FiArrowLeft />
            </button>
            
            <div className="range-pills">
               {['Day', 'Week', 'Month', 'Year'].map(r => (
                 <button key={r} className={`pill ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
               ))}
            </div>

            <button className="calendar-btn"><FiCalendar /></button>
          </div>

          <div className="stats-block">
             <h2>Average <span className="highlight-orange">{average || '--'} HOURS</span></h2>
             <p className="date-range-sub">
                Trends from your recorded sleep duration
             </p>
          </div>

          <div className="chart-container">
             {loading ? <div className="loader-box">Loading...</div> : renderChart()}
          </div>

          <div className="today-reading-block">
             <div className="today-header">
                <h3>Latest Reading</h3>
                <button className="add-reading-btn" onClick={() => setIsAdding(!isAdding)}>
                   {isAdding ? 'Close' : <FiPlus />}
                </button>
             </div>
             
             {isAdding ? (
                <div className="add-form">
                   <input 
                      type="number" 
                      step="0.1"
                      placeholder="e.g. 7.5" 
                      value={newHours} 
                      onChange={e => setNewHours(e.target.value)} 
                   />
                   <button onClick={handleAddReading}>Save</button>
                </div>
             ) : (
                <h1 className="highlight-orange">
                   {todayLog.hours || '--'} <span className="unit">HOURS</span>
                </h1>
             )}
             <p className="date-sub">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sleep;