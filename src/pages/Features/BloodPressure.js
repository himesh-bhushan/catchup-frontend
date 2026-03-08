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
      // 1. FETCH LATEST FROM PROFILE (Matches Dashboard 110/75)
      const { data: profile } = await supabase
        .from('profiles')
        .select('blood_pressure')
        .eq('id', user.id)
        .single();

      if (profile?.blood_pressure) {
        const [sys, dia] = profile.blood_pressure.split('/');
        setTodayLog({ 
          systolic: parseInt(sys), 
          diastolic: parseInt(dia), 
          date: new Date().toISOString() 
        });
      }

      // 2. FETCH HISTORY FROM LOGS (For the Graph & Previous Days)
      const { data: history, error: historyError } = await supabase
        .from('blood_pressure_logs')
        .select('systolic, diastolic, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!historyError && history && history.length > 0) {
        setLogs(history);

        // Calculate Average across all historical entries
        const totalSys = history.reduce((sum, log) => sum + log.systolic, 0);
        const totalDia = history.reduce((sum, log) => sum + log.diastolic, 0);
        setAverage({
          systolic: Math.round(totalSys / history.length),
          diastolic: Math.round(totalDia / history.length)
        });
      }
    } catch (err) {
      console.error("Error fetching BP data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBPData();
  }, [fetchBPData, range]);

  const handleAddReading = async () => {
    if (!newReading.systolic || !newReading.diastolic) return;

    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedBP = `${newReading.systolic}/${newReading.diastolic}`;

    // Update both tables to keep Dashboard and History in sync
    const { error: logError } = await supabase
      .from('blood_pressure_logs')
      .upsert({
        user_id: user.id,
        date: todayStr,
        systolic: parseInt(newReading.systolic),
        diastolic: parseInt(newReading.diastolic)
      }, { onConflict: 'user_id,date' });

    const { error: profError } = await supabase
        .from('profiles')
        .update({ blood_pressure: formattedBP })
        .eq('id', user.id);

    if (!logError && !profError) {
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
            <FiActivity size={40} color="#ccc" />
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
        
        {/* Y-Axis Grid Lines */}
        {[60, 90, 120, 150, 180].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="#F0F0F0" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="#BBB" fontFamily="Poppins">{val}</text>
           </g>
        ))}

        {/* Line connecting points */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots for each day */}
        {logs.map((log, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(log.systolic)} r="7" fill="#FF3B30" stroke="white" strokeWidth="3" />
          </g>
        ))}

        {/* X-Axis Dates */}
        {logs.map((log, i) => (
          <text key={i} x={getX(i)} y={height + 35} fontSize="14" fill="#999" textAnchor="middle" fontFamily="Poppins">
            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </text>
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
            <button className="bp-back-btn" onClick={() => navigate('/dashboard')}>
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
             <h2>Average <span className="highlight-red">{average.systolic || '--'}/{average.diastolic || '--'}</span></h2>
             <p className="date-range-sub">
                Trends from your recorded history
             </p>
          </div>

          <div className="chart-container">
             {loading ? <div className="loader-box">Syncing...</div> : renderChart()}
          </div>

          <div className="today-reading-block">
             <div className="today-header">
                <h3>Latest Entry</h3>
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
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BloodPressure;