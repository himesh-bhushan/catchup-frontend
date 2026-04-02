import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiActivity } from 'react-icons/fi';
import { supabase } from '../../supabase';

// --- Components ---
import DashboardNav from '../../components/DashboardNav';

// --- Styles ---
import './BloodPressure.css';

const BloodPressure = () => {
  const navigate = useNavigate();
  
  // 🌟 ADDED: Date State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ systolic: 0, diastolic: 0 });
  const [average, setAverage] = useState({ systolic: 0, diastolic: 0 });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newReading, setNewReading] = useState({ systolic: '', diastolic: '' });
  const [loading, setLoading] = useState(true);

  const fetchBPData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 🌟 UPDATED: Check if the selected date is Today
      const isToday = date === new Date().toISOString().split('T')[0];
      let sys = 0;
      let dia = 0;

      if (isToday) {
        // 1. FETCH LATEST FROM PROFILE (If Today)
        const { data: profile } = await supabase
          .from('profiles')
          .select('blood_pressure')
          .eq('id', user.id)
          .single();

        if (profile?.blood_pressure) {
          const [s, d] = profile.blood_pressure.split('/');
          sys = parseInt(s);
          dia = parseInt(d);
        }
      } else {
        // 1. FETCH FROM LOGS (If Past Date)
        const { data: logEntry } = await supabase
          .from('blood_pressure_logs')
          .select('systolic, diastolic')
          .eq('user_id', user.id)
          .eq('date', date)
          .maybeSingle();

        if (logEntry) {
          sys = logEntry.systolic;
          dia = logEntry.diastolic;
        }
      }

      setTodayLog({ 
        systolic: sys, 
        diastolic: dia, 
        date: date 
      });

      // 🌟 FIX 1: DYNAMIC LIMITS BASED ON SELECTED RANGE
      let limit = 7;
      if (range === 'Month') limit = 30;
      if (range === 'Year') limit = 365;
      if (range === 'Day') limit = 1;

      // 2. FETCH HISTORY FROM LOGS (For the Graph & Previous Days)
      const { data: history, error: historyError } = await supabase
        .from('blood_pressure_logs')
        .select('systolic, diastolic, date')
        .eq('user_id', user.id)
        .lte('date', date)
        .order('date', { ascending: false }) // Fetch descending to get newest first up to the limit
        .limit(limit);

      if (!historyError && history && history.length > 0) {
        const formattedHistory = history.reverse(); // Reverse back for chronological graphing
        setLogs(formattedHistory);

        // Calculate Average across all historical entries
        const totalSys = formattedHistory.reduce((sum, log) => sum + log.systolic, 0);
        const totalDia = formattedHistory.reduce((sum, log) => sum + log.diastolic, 0);
        setAverage({
          systolic: Math.round(totalSys / formattedHistory.length),
          diastolic: Math.round(totalDia / formattedHistory.length)
        });
      } else {
        setLogs([]);
        setAverage({ systolic: 0, diastolic: 0 });
      }
    } catch (err) {
      console.error("Error fetching BP data:", err);
    } finally {
      setLoading(false);
    }
  }, [date, range]); // 🌟 FIX: Added 'range' as a dependency so chart updates on pill click

  useEffect(() => {
    fetchBPData();
  }, [fetchBPData, range, date]); // 🌟 ADDED: 'date' to useEffect

  const handleAddReading = async () => {
    if (!newReading.systolic || !newReading.diastolic) return;

    const { data: { user } } = await supabase.auth.getUser();
    const formattedBP = `${newReading.systolic}/${newReading.diastolic}`;

    // Update log for the SELECTED date
    const { error: logError } = await supabase
      .from('blood_pressure_logs')
      .upsert({
        user_id: user.id,
        date: date, // 🌟 UPDATED: Uses selected date instead of "today"
        systolic: parseInt(newReading.systolic),
        diastolic: parseInt(newReading.diastolic)
      }, { onConflict: 'user_id,date' });

    // Only update the profile if the reading is for Today
    const isToday = date === new Date().toISOString().split('T')[0];
    
    if (isToday) {
      await supabase
          .from('profiles')
          .update({ blood_pressure: formattedBP })
          .eq('id', user.id);
    }

    if (!logError) {
      setIsAdding(false);
      setNewReading({ systolic: '', diastolic: '' });
      fetchBPData(); // Refresh UI without full reload
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <FiActivity size={40} color="var(--text-secondary)" />
            <p>No history for this period. Sync Apple Health to see your trends.</p>
         </div>
       );
    }

    const minVal = 40; 
    const maxVal = 200;
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

    // Create points for Systolic line
    const points = logs.map((log, i) => `${getX(i)},${getY(log.systolic)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="bp-chart-svg">
        
        {/* Y-Axis Grid Lines - CHANGED TO VARS */}
        {[60, 90, 120, 150, 180].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="var(--border-color)" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="var(--text-secondary)" fontFamily="Poppins">{val}</text>
           </g>
        ))}

        {/* Line connecting points */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots for each day - ADDED VAR FOR STROKE */}
        {logs.map((log, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(log.systolic)} r="7" fill="#FF3B30" stroke="var(--card-bg)" strokeWidth="3" />
          </g>
        ))}

        {/* 🌟 FIX 2: DYNAMICALLY SPACED X-AXIS LABELS */}
        {logs.map((log, i) => {
          let label = '';
          const d = new Date(log.date);
          
          if (range === 'Day' || range === 'Week') {
              label = d.toLocaleDateString('en-US', { weekday: 'short' });
          } else if (range === 'Month') {
              // Only show ~6 labels spread across the month
              if (i % Math.ceil(logs.length / 5) === 0 || i === logs.length - 1) {
                  label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
          } else if (range === 'Year') {
              // Only show ~8 labels spread across the year
              if (i % Math.ceil(logs.length / 8) === 0 || i === logs.length - 1) {
                  label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }
          }

          return label ? (
            <text key={i} x={getX(i)} y={height + 35} fontSize="14" fill="var(--text-secondary)" textAnchor="middle" fontFamily="Poppins">
              {label}
            </text>
          ) : null;
        })}
      </svg>
    );
  };

  return (
    <div className="dashboard-wrapper bp-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="bp-page-container">
          
          <div className="bp-header">
            <button className="bp-back-btn" onClick={() => navigate('/dashboard')}>
                <FiArrowLeft />
            </button>
            
            <div className="range-pills">
               {['Day', 'Week', 'Month', 'Year'].map(r => (
                 <button key={r} className={`pill ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
               ))}
            </div>

            {/* 🌟 UPDATED: Wrapped the icon in an invisible date input */}
            <button className="calendar-btn" style={{ position: 'relative', overflow: 'hidden' }}>
              <FiCalendar />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                max={new Date().toISOString().split('T')[0]} 
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', left: 0, top: 0 }}
              />
            </button>
          </div>

          <div className="stats-block">
             {/* THE AVERAGE TEXT IS CONTROLLED BY CSS NOW */}
             <h2>Average <span className="highlight-red">{average.systolic || '--'}/{average.diastolic || '--'}</span></h2>
             <p className="date-range-sub">
                Trends from your recorded history
             </p>
          </div>

          <div className="chart-container">
             {loading ? <div className="loader-box" style={{color: 'var(--text-secondary)'}}>Syncing...</div> : renderChart()}
          </div>

          <div className="today-reading-block">
             <div className="today-header">
                <h3>{date === new Date().toISOString().split('T')[0] ? 'Latest Entry' : 'Entry for Date'}</h3>
                <button className="add-reading-btn" onClick={() => setIsAdding(!isAdding)}>
                   {isAdding ? 'Close' : <FiPlus />}
                </button>
             </div>
             
             {isAdding ? (
                <div className="add-form">
                   <input 
                      type="number" 
                      placeholder="Systolic" 
                      value={newReading.systolic} 
                      onChange={e => setNewReading({...newReading, systolic: e.target.value})} 
                   />
                   <span className="divider">/</span>
                   <input 
                      type="number" 
                      placeholder="Diastolic" 
                      value={newReading.diastolic} 
                      onChange={e => setNewReading({...newReading, diastolic: e.target.value})} 
                   />
                   <button onClick={handleAddReading}>Save</button>
                </div>
             ) : (
                <h1 className="highlight-red">
                   {todayLog.systolic || '--'}/{todayLog.diastolic || '--'} <span className="unit">mmHg</span>
                </h1>
             )}
             <p className="date-sub">
                {/* 🌟 UPDATED: Shows the selected date instead of "today" */}
                {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BloodPressure;