import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiActivity } from 'react-icons/fi';
import { supabase } from '../../supabase';

import DashboardNav from '../../components/DashboardNav';
import './BloodPressure.css';

const BloodPressure = () => {
  const navigate = useNavigate();
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
      const isToday = date === new Date().toISOString().split('T')[0];
      let sys = 0; let dia = 0;

      if (isToday) {
        const { data: profile } = await supabase.from('profiles').select('blood_pressure').eq('id', user.id).single();
        if (profile?.blood_pressure) {
          const [s, d] = profile.blood_pressure.split('/');
          sys = parseInt(s); dia = parseInt(d);
        }
      } else {
        const { data: logEntry } = await supabase.from('blood_pressure_logs').select('systolic, diastolic').eq('user_id', user.id).eq('date', date).maybeSingle();
        if (logEntry) { sys = logEntry.systolic; dia = logEntry.diastolic; }
      }

      setTodayLog({ systolic: sys, diastolic: dia, date: date });

      let limit = 7;
      if (range === 'Month') limit = 30;
      if (range === 'Year') limit = 365;
      if (range === 'Day') limit = 1;

      const { data: history, error: historyError } = await supabase
        .from('blood_pressure_logs')
        .select('systolic, diastolic, date')
        .eq('user_id', user.id)
        .lte('date', date)
        .order('date', { ascending: false }) 
        .limit(limit);

      if (!historyError && history && history.length > 0) {
        const formattedHistory = history.reverse(); 
        setLogs(formattedHistory);
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
  }, [date, range]); 

  useEffect(() => { fetchBPData(); }, [fetchBPData, range, date]);

  const handleAddReading = async () => {
    if (!newReading.systolic || !newReading.diastolic) return;
    const { data: { user } } = await supabase.auth.getUser();
    const formattedBP = `${newReading.systolic}/${newReading.diastolic}`;

    const { error: logError } = await supabase.from('blood_pressure_logs').upsert({
        user_id: user.id, date: date, systolic: parseInt(newReading.systolic), diastolic: parseInt(newReading.diastolic)
      }, { onConflict: 'user_id,date' });

    const isToday = date === new Date().toISOString().split('T')[0];
    if (isToday) { await supabase.from('profiles').update({ blood_pressure: formattedBP }).eq('id', user.id); }

    if (!logError) {
      setIsAdding(false);
      setNewReading({ systolic: '', diastolic: '' });
      fetchBPData(); 
    }
  };

  // 🌟 COMPLETELY REWRITTEN RENDER CHART FUNCTION
  const renderChart = () => {
    const width = 1000; const height = 250; const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <FiActivity size={40} color="var(--text-secondary)" />
            <p>No history for this period. Sync Apple Health to see your trends.</p>
         </div>
       );
    }

    const minVal = 40; const maxVal = 200;
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;

    // --- PROPORTIONAL TIME SCALING ---
    const targetDate = new Date(date);
    targetDate.setHours(23, 59, 59, 999);
    const maxTime = targetDate.getTime();
    let minTime;
    let xLabels = [];

    if (range === 'Day') {
        // Timeline: 12 AM to 11 PM
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        minTime = startOfDay.getTime();
        xLabels = [
            { label: '12 AM', time: minTime },
            { label: '6 AM', time: minTime + 6 * 3600000 },
            { label: '12 PM', time: minTime + 12 * 3600000 },
            { label: '6 PM', time: minTime + 18 * 3600000 },
            { label: '11 PM', time: maxTime }
        ];
    } else if (range === 'Week') {
        // Timeline: Past 7 Days
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);
        minTime = startOfWeek.getTime();
        for (let i = 0; i <= 6; i++) {
            const t = minTime + (i * 24 * 3600000);
            xLabels.push({ label: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }), time: t + (12 * 3600000) });
        }
    } else if (range === 'Month') {
        // Timeline: Past 30 Days (Labels every ~6 days)
        const startOfMonth = new Date(targetDate);
        startOfMonth.setDate(targetDate.getDate() - 29);
        startOfMonth.setHours(0, 0, 0, 0);
        minTime = startOfMonth.getTime();
        for (let i = 0; i <= 4; i++) {
            const t = minTime + (i * 7.25 * 24 * 3600000); 
            xLabels.push({ label: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), time: t });
        }
    } else if (range === 'Year') {
        // Timeline: Past 365 Days (Labels every ~2.5 months)
        const startOfYear = new Date(targetDate);
        startOfYear.setFullYear(targetDate.getFullYear() - 1);
        startOfYear.setHours(0, 0, 0, 0);
        minTime = startOfYear.getTime();
        for (let i = 0; i <= 5; i++) {
            const t = minTime + (i * 73 * 24 * 3600000); 
            xLabels.push({ label: new Date(t).toLocaleDateString('en-US', { month: 'short' }), time: t });
        }
    }

    // Mathematically calculates exact horizontal placement based on the timestamp
    const getX = (logDateStr) => {
        const d = new Date(logDateStr);
        d.setHours(12, 0, 0, 0); // Sets time to noon so it plots exactly in the middle of that day
        const logTime = d.getTime();
        if (maxTime === minTime) return (width - padding) / 2;
        const timeOffset = Math.max(minTime, Math.min(maxTime, logTime)); 
        return ((timeOffset - minTime) / (maxTime - minTime)) * (width - padding);
    };

    const points = logs.map((log) => `${getX(log.date)},${getY(log.systolic)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="bp-chart-svg">
        
        {/* Y-Axis Grid Lines */}
        {[60, 90, 120, 150, 180].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="var(--border-color)" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="var(--text-secondary)" fontFamily="Poppins">{val}</text>
           </g>
        ))}

        {/* X-Axis Proportional Grid Labels */}
        {xLabels.map((lbl, i) => {
          const xPos = ((lbl.time - minTime) / (maxTime - minTime)) * (width - padding);
          return (
            <text key={i} x={xPos} y={height + 35} fontSize="14" fill="var(--text-secondary)" textAnchor="middle" fontFamily="Poppins">
              {lbl.label}
            </text>
          )
        })}

        {/* Line connecting points */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots for each day */}
        {logs.map((log, i) => (
          <circle key={i} cx={getX(log.date)} cy={getY(log.systolic)} r="7" fill="#FF3B30" stroke="var(--card-bg)" strokeWidth="3" />
        ))}

      </svg>
    );
  };

  return (
    <div className="dashboard-wrapper bp-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="bp-page-container">
          
          <div className="bp-header">
            <button className="bp-back-btn" onClick={() => navigate('/dashboard')}><FiArrowLeft /></button>
            <div className="range-pills">
               {['Day', 'Week', 'Month', 'Year'].map(r => (
                 <button key={r} className={`pill ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
               ))}
            </div>
            <button className="calendar-btn" style={{ position: 'relative', overflow: 'hidden' }}>
              <FiCalendar />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', left: 0, top: 0 }} />
            </button>
          </div>

          <div className="stats-block">
             <h2>Average <span className="highlight-red">{average.systolic || '--'}/{average.diastolic || '--'}</span></h2>
             <p className="date-range-sub">Trends from your recorded history</p>
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
                   <input type="number" placeholder="Systolic" value={newReading.systolic} onChange={e => setNewReading({...newReading, systolic: e.target.value})} />
                   <span className="divider">/</span>
                   <input type="number" placeholder="Diastolic" value={newReading.diastolic} onChange={e => setNewReading({...newReading, diastolic: e.target.value})} />
                   <button onClick={handleAddReading}>Save</button>
                </div>
             ) : (
                <h1 className="highlight-red">
                   {todayLog.systolic || '--'}/{todayLog.diastolic || '--'} <span className="unit">mmHg</span>
                </h1>
             )}
             <p className="date-sub">
                {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BloodPressure;