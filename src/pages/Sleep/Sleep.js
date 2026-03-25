import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiMoon } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';
import './Sleep.css';

const Sleep = () => {
  const navigate = useNavigate();
  
  // Date & Range States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [range, setRange] = useState('Week'); 
  
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState({ hours: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newHours, setNewHours] = useState('');
  const [loading, setLoading] = useState(true);

  // --- NEW: Reference for the date picker ---
  const dateInputRef = useRef(null);

  const fetchSleepData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const isToday = selectedDate === new Date().toISOString().split('T')[0];

      // 1. FETCH READING FOR SELECTED DATE
      if (isToday) {
        const { data: profile } = await supabase.from('profiles').select('sleep_seconds').eq('id', user.id).single();
        setSelectedLog({ hours: profile?.sleep_seconds ? parseFloat((profile.sleep_seconds / 3600).toFixed(1)) : 0 });
      } else {
        const { data: log } = await supabase.from('sleep_logs').select('hours, seconds').eq('user_id', user.id).eq('date', selectedDate).maybeSingle();
        setSelectedLog({ hours: log ? (log.hours ? parseFloat(log.hours) : parseFloat((log.seconds / 3600).toFixed(1))) : 0 });
      }

      // 2. FETCH HISTORY FOR GRAPH
      let limit = 7;
      if (range === 'Month') limit = 30;
      if (range === 'Year') limit = 365;
      if (range === 'Day') limit = 1;

      const { data: history, error: historyError } = await supabase
        .from('sleep_logs')
        .select('hours, seconds, date')
        .eq('user_id', user.id)
        .lte('date', selectedDate) 
        .order('date', { ascending: false })
        .limit(limit);

      if (!historyError && history && history.length > 0) {
        const formattedHistory = history.reverse().map(log => ({
            ...log,
            hours: log.hours ? parseFloat(log.hours) : parseFloat((log.seconds / 3600).toFixed(1))
        }));
        
        setLogs(formattedHistory);
        const totalHours = formattedHistory.reduce((sum, log) => sum + log.hours, 0);
        setAverage((totalHours / formattedHistory.length).toFixed(1));
      } else {
        setLogs([]);
        setAverage(0);
      }
    } catch (err) {
      console.error("Error fetching Sleep data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, range]);

  useEffect(() => {
    fetchSleepData();
  }, [fetchSleepData]);

  const handleAddReading = async () => {
    if (!newHours) return;

    const { data: { user } } = await supabase.auth.getUser();
    const hoursValue = parseFloat(newHours);
    const secondsValue = Math.round(hoursValue * 3600);

    const { error: logError } = await supabase
      .from('sleep_logs')
      .upsert({
        user_id: user.id,
        date: selectedDate, 
        hours: hoursValue,
        seconds: secondsValue
      }, { onConflict: 'user_id,date' });

    if (selectedDate === new Date().toISOString().split('T')[0]) {
        await supabase.from('profiles').update({ sleep_seconds: secondsValue }).eq('id', user.id);
    }

    if (!logError) {
      setIsAdding(false);
      setNewHours('');
      fetchSleepData(); 
    }
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
        try {
            dateInputRef.current.showPicker();
        } catch (e) {
            dateInputRef.current.focus();
        }
    }
  };

  const renderChart = () => {
    const width = 1000; const height = 250; const padding = 50; 
    if (logs.length < 1) return (<div className="no-data-container"><FiMoon size={40} color="var(--text-secondary)" /><p>No sleep history found for this period.</p></div>);

    const minVal = 0; const maxVal = 12; 
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);
    const points = logs.map((log, i) => `${getX(i)},${getY(log.hours)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="sleep-chart-svg">
        {/* CHANGED: SVG gridlines and text now use variables */}
        {[2, 4, 6, 8, 10, 12].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="var(--border-color)" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="var(--text-secondary)" fontFamily="Poppins">{val}h</text>
           </g>
        ))}
        {logs.length > 1 && <polyline points={points} fill="none" stroke="#F7931E" strokeWidth="4" strokeLinecap="round" />}
        {/* CHANGED: Circle stroke now matches card background */}
        {logs.map((log, i) => <circle key={i} cx={getX(i)} cy={getY(log.hours)} r="7" fill="#F7931E" stroke="var(--card-bg)" strokeWidth="3" />)}
        {/* CHANGED: Bottom labels use variables */}
        {logs.map((log, i) => (
          <text key={i} x={getX(i)} y={height + 35} fontSize="14" fill="var(--text-secondary)" textAnchor="middle" fontFamily="Poppins">
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
            <button className="sleep-back-btn" onClick={() => navigate('/dashboard')}><FiArrowLeft /></button>
            <div className="range-pills">
               {['Day', 'Week', 'Month', 'Year'].map(r => (
                 <button key={r} className={`pill ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
               ))}
            </div>

            {/* --- FIXED CALENDAR BUTTON --- */}
            <div style={{ position: 'relative' }}>
                <button className="calendar-btn" onClick={handleCalendarClick}>
                  <FiCalendar />
                </button>
                <input 
                    ref={dateInputRef}
                    type="date" 
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      right: 0, 
                      opacity: 0, 
                      pointerEvents: 'none', 
                      width: '40px',
                      height: '40px'
                    }}
                />
            </div>
          </div>

          <div className="stats-block">
             <h2>Average <span className="highlight-orange">{average || '--'} HOURS</span></h2>
             <p className="date-range-sub">Trends from your recorded sleep</p>
          </div>

          <div className="chart-container">
             {loading ? <div className="loader-box" style={{ color: 'var(--text-secondary)'}}>Loading...</div> : renderChart()}
          </div>

          <div className="today-reading-block">
             <div className="today-header">
                <h3>{selectedDate === new Date().toISOString().split('T')[0] ? "Today's Reading" : "Logged Reading"}</h3>
                <button className="add-reading-btn" onClick={() => setIsAdding(!isAdding)}>
                   {isAdding ? 'Close' : <FiPlus />}
                </button>
             </div>
             
             {isAdding ? (
                <div className="add-form">
                   <input type="number" step="0.1" placeholder="e.g. 7.5" value={newHours} onChange={e => setNewHours(e.target.value)} />
                   <button onClick={handleAddReading}>Save to {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</button>
                </div>
             ) : (
                <h1 className="highlight-orange">
                   {selectedLog.hours || '--'} <span className="unit">HOURS</span>
                </h1>
             )}
             <p className="date-sub">
                {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sleep;