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
    const fetchBPFromProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🟢 FETCH: Get the live reading from the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('blood_pressure')
        .eq('id', user.id)
        .single();

      if (error) {
          console.error('Error fetching BP:', error);
          return;
      }

      if (profile && profile.blood_pressure) {
        // Split the "120/80" string into numbers
        const parts = profile.blood_pressure.split('/');
        const sys = parseInt(parts[0]);
        const dia = parseInt(parts[1]);

        const latestReading = {
            systolic: sys,
            diastolic: dia,
            date: new Date().toISOString().split('T')[0]
        };

        setTodayLog(latestReading);
        setAverage({ systolic: sys, diastolic: dia });
        
        // We put it in an array so the chart has at least one point to show
        setLogs([latestReading]);
      }
    };
    
    fetchBPFromProfile();
  }, [range]);

  const handleAddReading = async () => {
    if (!newReading.systolic || !newReading.diastolic) return;

    const { data: { user } } = await supabase.auth.getUser();
    const formattedBP = `${newReading.systolic}/${newReading.diastolic}`;

    // 🟢 UPDATE: Save back to the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ blood_pressure: formattedBP })
      .eq('id', user.id);

    if (!error) {
      setIsAdding(false);
      setTodayLog({ systolic: parseInt(newReading.systolic), diastolic: parseInt(newReading.diastolic) });
      setAverage({ systolic: parseInt(newReading.systolic), diastolic: parseInt(newReading.diastolic) });
      setLogs([{ 
          systolic: parseInt(newReading.systolic), 
          diastolic: parseInt(newReading.diastolic), 
          date: new Date().toISOString().split('T')[0] 
      }]);
      setNewReading({ systolic: '', diastolic: '' });
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1 || !logs[0].systolic) {
       return (
         <div className="no-data-container">
            <p>Sync your Apple Health or add a reading below</p>
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
             <h2>Latest Reading <span className="highlight-red">{average.systolic || '--'}/{average.diastolic || '--'}</span></h2>
             <p className="date-range-sub">
                Synced from Apple Health
             </p>
          </div>

          <div className="chart-container">
             {renderChart()}
          </div>

          <div className="today-reading-block">
             <div className="today-header">
                <h3>Current Status</h3>
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
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BloodPressure;