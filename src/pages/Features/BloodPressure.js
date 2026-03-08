import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus } from 'react-icons/fi';
import { supabase } from '../../supabase';

// --- ADDED: Import Navigation Bar ---
import DashboardNav from '../../components/DashboardNav';

import './BloodPressure.css';

const BloodPressure = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ systolic: 0, diastolic: 0 });
  const [average, setAverage] = useState({ systolic: 0, diastolic: 0 });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newReading, setNewReading] = useState({ systolic: '', diastolic: '' });

  useEffect(() => {
    const fetchBPLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🟢 CHANGE: Fetch from blood_pressure_logs to get the history for the graph
      const { data, error } = await supabase
        .from('blood_pressure_logs')
        .select('systolic, diastolic, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
          console.error('Error fetching BP logs:', error);
          return;
      }

      if (data && data.length > 0) {
        setLogs(data);
        
        // The last item in the sorted array is our "latest" reading
        const latest = data[data.length - 1];
        setTodayLog(latest);

        // Calculate Average for the range
        const avgSys = Math.round(data.reduce((acc, curr) => acc + curr.systolic, 0) / data.length);
        const avgDia = Math.round(data.reduce((acc, curr) => acc + curr.diastolic, 0) / data.length);
        
        setAverage({ systolic: avgSys, diastolic: avgDia });
      }
    };
    
    fetchBPLogs();
  }, [range]);

  const handleAddReading = async () => {
    if (!newReading.systolic || !newReading.diastolic) return;

    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];

    // 🟢 CHANGE: Upsert into blood_pressure_logs so it shows in history
    const { error } = await supabase
      .from('blood_pressure_logs')
      .upsert({
        user_id: user.id,
        date: todayStr,
        systolic: parseInt(newReading.systolic),
        diastolic: parseInt(newReading.diastolic)
      }, { onConflict: 'user_id,date' });

    if (!error) {
      // Also update profile for the dashboard summary
      await supabase
        .from('profiles')
        .update({ blood_pressure: `${newReading.systolic}/${newReading.diastolic}` })
        .eq('id', user.id);

      setIsAdding(false);
      window.location.reload(); // Refresh to pull updated history
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <p>Sync your Apple Health or add a reading below to see your trends.</p>
         </div>
       );
    }

    const minVal = 40; 
    const maxVal = 200;
    
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

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

        {/* Line */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots */}
        {logs.map((log, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(log.systolic)} r="7" fill="#FF3B30" stroke="white" strokeWidth="3" />
          </g>
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
    <div className="dashboard-wrapper bp-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="bp-page-container">
          
          <div className="bp-header">
            <button className="bp-back-btn" onClick={() => navigate('/dashboard')}>
                <FiArrowLeft />
            </button>
            
            <div className="range-pills">
               {['Day', 'Week', 'Month', '6 Months', 'Year'].map(r => (
                 <button key={r} className={`pill ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
               ))}
            </div>

            <button className="calendar-btn"><FiCalendar /></button>
          </div>

          <div className="stats-block">
             <h2>Average <span className="highlight-red">{average.systolic || '--'}/{average.diastolic || '--'}</span></h2>
             <p className="date-range-sub">
                Based on your {range.toLowerCase()} history
             </p>
          </div>

          <div className="chart-container">
             {renderChart()}
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
                      placeholder="Systolic (120)" 
                      value={newReading.systolic} 
                      onChange={e => setNewReading({...newReading, systolic: e.target.value})} 
                   />
                   <span className="divider">/</span>
                   <input 
                      type="number" 
                      placeholder="Diastolic (80)" 
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
                {todayLog.date 
                  ? new Date(todayLog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                }
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BloodPressure;