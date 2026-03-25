import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';
import './Water.css';

const Water = () => {
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [range, setRange] = useState('Week'); 
  
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState({ liters: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newWater, setNewWater] = useState('');
  const [loading, setLoading] = useState(true);

  // --- NEW: Reference for the date picker ---
  const dateInputRef = useRef(null);

  const fetchWaterData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const isToday = selectedDate === new Date().toISOString().split('T')[0];

      if (isToday) {
        const { data: profile } = await supabase.from('profiles').select('water_intake').eq('id', user.id).single();
        setSelectedLog({ liters: profile?.water_intake ? parseFloat((profile.water_intake / 1000).toFixed(1)) : 0 });
      } else {
        const { data: log } = await supabase.from('water_logs').select('water_ml').eq('user_id', user.id).eq('date', selectedDate).maybeSingle();
        setSelectedLog({ liters: log?.water_ml ? parseFloat((log.water_ml / 1000).toFixed(1)) : 0 });
      }

      let limit = 7;
      if (range === 'Month') limit = 30;
      if (range === 'Year') limit = 365;
      if (range === 'Day') limit = 1;

      const { data: history, error: historyError } = await supabase
        .from('water_logs')
        .select('water_ml, date')
        .eq('user_id', user.id)
        .lte('date', selectedDate) 
        .order('date', { ascending: false })
        .limit(limit);

      if (!historyError && history && history.length > 0) {
        const formattedHistory = history.reverse().map(log => ({
            ...log,
            liters: parseFloat((log.water_ml / 1000).toFixed(1))
        }));
        
        setLogs(formattedHistory);
        const totalWater = formattedHistory.reduce((sum, log) => sum + log.liters, 0);
        setAverage((totalWater / formattedHistory.length).toFixed(1));
      } else {
        setLogs([]);
        setAverage(0);
      }
    } catch (err) {
      console.error("Error fetching Water data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, range]);

  useEffect(() => {
    fetchWaterData();
  }, [fetchWaterData]);

  const handleAddReading = async () => {
    if (!newWater) return;

    const { data: { user } } = await supabase.auth.getUser();
    const litersValue = parseFloat(newWater);
    const mlValue = Math.round(litersValue * 1000);

    const { error: logError } = await supabase
      .from('water_logs')
      .upsert({
        user_id: user.id,
        date: selectedDate,
        water_ml: mlValue
      }, { onConflict: 'user_id,date' });

    if (selectedDate === new Date().toISOString().split('T')[0]) {
        await supabase.from('profiles').update({ water_intake: mlValue }).eq('id', user.id);
    }

    if (!logError) {
      setIsAdding(false);
      setNewWater('');
      fetchWaterData();
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
    // 🌟 CHANGED SVG FILL COLORS TO CSS VARIABLES
    if (logs.length < 1) return (<div className="no-data-container"><FiDroplet size={40} color="var(--text-secondary)" /><p>No water history found for this period.</p></div>);

    const minVal = 0; const maxVal = 5; 
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);
    const points = logs.map((log, i) => `${getX(i)},${getY(log.liters)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="water-chart-svg">
        {[1, 2, 3, 4, 5].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="var(--border-color)" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="var(--text-secondary)" fontFamily="Poppins">{val}L</text>
           </g>
        ))}
        {logs.length > 1 && <polyline points={points} fill="none" stroke="#4A90E2" strokeWidth="4" strokeLinecap="round" />}
        {logs.map((log, i) => <circle key={i} cx={getX(i)} cy={getY(log.liters)} r="7" fill="#4A90E2" stroke="var(--card-bg)" strokeWidth="3" />)}
        {logs.map((log, i) => (
          <text key={i} x={getX(i)} y={height + 35} fontSize="14" fill="var(--text-secondary)" textAnchor="middle" fontFamily="Poppins">
            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="dashboard-wrapper water-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">
        <div className="water-page-container">
          
          <div className="water-header">
            <button className="water-back-btn" onClick={() => navigate('/dashboard')}><FiArrowLeft /></button>
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
             <h2>Average <span className="highlight-blue">{average || '--'} LITERS</span></h2>
             <p className="date-range-sub">Trends from your recorded hydration</p>
          </div>

          <div className="chart-container">
             {/* 🌟 CHANGED LOADING TEXT TO VARIABLE */}
             {loading ? <div className="loader-box" style={{color: 'var(--text-secondary)'}}>Loading...</div> : renderChart()}
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
                   <input type="number" step="0.1" placeholder="e.g. 2.5" value={newWater} onChange={e => setNewWater(e.target.value)} />
                   <button onClick={handleAddReading}>Save to {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</button>
                </div>
             ) : (
                <h1 className="highlight-blue">
                   {selectedLog.liters || '--'} <span className="unit">L</span>
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

export default Water;