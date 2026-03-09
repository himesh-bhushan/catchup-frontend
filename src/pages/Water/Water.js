import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';

// --- Components ---
import DashboardNav from '../../components/DashboardNav';

// --- Styles ---
import './Water.css';

const Water = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ liters: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newWater, setNewWater] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWaterData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. FETCH LATEST FROM PROFILE
      const { data: profile } = await supabase
        .from('profiles')
        .select('water_intake')
        .eq('id', user.id)
        .single();

      if (profile?.water_intake) {
        setTodayLog({ 
          liters: parseFloat((profile.water_intake / 1000).toFixed(1)), 
          date: new Date().toISOString() 
        });
      }

      // 2. FETCH HISTORY FROM LOGS (For the Graph)
      // Make sure you create a "water_logs" table in your Supabase! (Columns: user_id, date, water_ml)
      const { data: history, error: historyError } = await supabase
        .from('water_logs')
        .select('water_ml, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!historyError && history && history.length > 0) {
        // Convert ML to Liters for the graph
        const formattedHistory = history.map(log => ({
            ...log,
            liters: parseFloat((log.water_ml / 1000).toFixed(1))
        }));
        
        setLogs(formattedHistory);

        // Calculate Average
        const totalWater = formattedHistory.reduce((sum, log) => sum + log.liters, 0);
        setAverage((totalWater / formattedHistory.length).toFixed(1));
      }
    } catch (err) {
      console.error("Error fetching Water data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaterData();
  }, [fetchWaterData, range]);

  const handleAddReading = async () => {
    if (!newWater) return;

    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];
    const litersValue = parseFloat(newWater);
    const mlValue = Math.round(litersValue * 1000);

    // Update Logs (History)
    const { error: logError } = await supabase
      .from('water_logs')
      .upsert({
        user_id: user.id,
        date: todayStr,
        water_ml: mlValue
      }, { onConflict: 'user_id,date' });

    // Update Profile (Dashboard)
    const { error: profError } = await supabase
        .from('profiles')
        .update({ water_intake: mlValue })
        .eq('id', user.id);

    if (!logError && !profError) {
      setIsAdding(false);
      setNewWater('');
      fetchWaterData(); // Refresh UI
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <FiDroplet size={40} color="#ccc" />
            <p>No water history found. Log your hydration to see trends.</p>
         </div>
       );
    }

    const minVal = 0; 
    const maxVal = 5; // Max range for water graph (5 Liters)
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

    const points = logs.map((log, i) => `${getX(i)},${getY(log.liters)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="water-chart-svg">
        
        {/* Y-Axis Grid Lines */}
        {[1, 2, 3, 4, 5].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="#F0F0F0" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="#BBB" fontFamily="Poppins">{val}L</text>
           </g>
        ))}

        {/* Line */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#4A90E2" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Dots */}
        {logs.map((log, i) => (
          <circle key={i} cx={getX(i)} cy={getY(log.liters)} r="7" fill="#4A90E2" stroke="white" strokeWidth="3" />
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
    <div className="dashboard-wrapper water-page-wrapper-bg">
      <DashboardNav />
      <div className="dashboard-content">

        <div className="water-page-container">
          
          <div className="water-header">
            <button className="water-back-btn" onClick={() => navigate('/dashboard')}>
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
             <h2>Average <span className="highlight-blue">{average || '--'} LITERS</span></h2>
             <p className="date-range-sub">
                Trends from your recorded water intake
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
                      placeholder="e.g. 2.5" 
                      value={newWater} 
                      onChange={e => setNewWater(e.target.value)} 
                   />
                   <button onClick={handleAddReading}>Save</button>
                </div>
             ) : (
                <h1 className="highlight-blue">
                   {todayLog.liters || '--'} <span className="unit">L</span>
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

export default Water;