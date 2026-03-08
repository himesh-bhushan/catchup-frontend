import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiHeart } from 'react-icons/fi';
import { supabase } from '../../supabase';

// --- Components ---
import DashboardNav from '../../components/DashboardNav';

// --- Styles ---
import './HeartRate.css';

const HeartRate = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ bpm: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newBPM, setNewBPM] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHRData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. FETCH LATEST FROM PROFILE (Matches Dashboard)
      const { data: profile } = await supabase
        .from('profiles')
        .select('heart_rate')
        .eq('id', user.id)
        .single();

      if (profile?.heart_rate) {
        setTodayLog({ 
          bpm: profile.heart_rate, 
          date: new Date().toISOString() 
        });
      }

      // 2. FETCH HISTORY FROM LOGS (For the Graph)
      const { data: history, error: historyError } = await supabase
        .from('heart_rate_logs')
        .select('bpm, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!historyError && history && history.length > 0) {
        setLogs(history);

        // Calculate Average
        const totalBPM = history.reduce((sum, log) => sum + log.bpm, 0);
        setAverage(Math.round(totalBPM / history.length));
      }
    } catch (err) {
      console.error("Error fetching HR data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHRData();
  }, [fetchHRData, range]);

  const handleAddReading = async () => {
    if (!newBPM) return;

    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];
    const bpmValue = parseInt(newBPM);

    // Update Logs (History)
    const { error: logError } = await supabase
      .from('heart_rate_logs')
      .upsert({
        user_id: user.id,
        date: todayStr,
        bpm: bpmValue
      }, { onConflict: 'user_id,date' });

    // Update Profile (Dashboard)
    const { error: profError } = await supabase
        .from('profiles')
        .update({ heart_rate: bpmValue })
        .eq('id', user.id);

    if (!logError && !profError) {
      setIsAdding(false);
      setNewBPM('');
      fetchHRData(); // Refresh UI
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <FiHeart size={40} color="#ccc" />
            <p>No heart rate history found. Sync Apple Health to see your trends.</p>
         </div>
       );
    }

    const minVal = 40; 
    const maxVal = 160; // Max range for the graph
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

    const points = logs.map((log, i) => `${getX(i)},${getY(log.bpm)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="hr-chart-svg">
        
        {/* Y-Axis Grid Lines */}
        {[60, 80, 100, 120, 140].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="#F0F0F0" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="#BBB" fontFamily="Poppins">{val}</text>
           </g>
        ))}

        {/* Line */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots */}
        {logs.map((log, i) => (
          <circle key={i} cx={getX(i)} cy={getY(log.bpm)} r="7" fill="#FF3B30" stroke="white" strokeWidth="3" />
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
    <div className="dashboard-wrapper hr-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="hr-page-container">
          
          <div className="hr-header">
            <button className="hr-back-btn" onClick={() => navigate('/dashboard')}>
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
             <h2>Average <span className="highlight-red">{average || '--'} BPM</span></h2>
             <p className="date-range-sub">
                Trends from your recorded heart rate
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
                      placeholder="e.g. 72" 
                      value={newBPM} 
                      onChange={e => setNewBPM(e.target.value)} 
                   />
                   <button onClick={handleAddReading}>Save</button>
                </div>
             ) : (
                <h1 className="highlight-red">
                   {todayLog.bpm || '--'} <span className="unit">BPM</span>
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

export default HeartRate;