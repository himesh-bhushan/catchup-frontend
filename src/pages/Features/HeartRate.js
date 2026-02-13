import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiPlus } from 'react-icons/fi';
import { supabase } from '../../supabase';
import './HeartRate.css'; // We'll create this CSS next

const HeartRate = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('Week'); 
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState({ bpm: 0 });
  const [average, setAverage] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newBPM, setNewBPM] = useState('');

  useEffect(() => {
    const fetchHRLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endDate = new Date();
      const startDate = new Date();
      if (range === 'Week') startDate.setDate(endDate.getDate() - 6);
      if (range === 'Month') startDate.setMonth(endDate.getMonth() - 1);
      if (range === '6 Months') startDate.setMonth(endDate.getMonth() - 6);
      if (range === 'Year') startDate.setFullYear(endDate.getFullYear() - 1);
      
      const { data, error } = await supabase
        .from('heart_rate_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) console.error('Error fetching HR:', error);
      if (data) {
        setLogs(data);
        calculateStats(data);
      }
    };
    fetchHRLogs();
  }, [range]);

  const calculateStats = (data) => {
    if (data.length === 0) {
        setAverage(0);
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const today = data.find(l => l.date === todayStr);
    if (today) setTodayLog(today);

    const totalBPM = data.reduce((sum, log) => sum + log.bpm, 0);
    setAverage(Math.round(totalBPM / data.length));
  };

  const handleAddReading = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const todayStr = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('heart_rate_logs').upsert({
      user_id: user.id,
      date: todayStr,
      bpm: parseInt(newBPM)
    });

    if (!error) {
      setIsAdding(false);
      window.location.reload(); 
    }
  };

  const renderChart = () => {
    const width = 1000; 
    const height = 250; 
    const padding = 50; 

    if (logs.length < 1) {
       return (
         <div className="no-data-container">
            <p>Not enough data to graph</p>
         </div>
       );
    }

    const minVal = 40; 
    const maxVal = 120; // Typical Heart Rate Range for graph
    
    const getY = (val) => height - ((val - minVal) / (maxVal - minVal)) * height;
    const getX = (index) => (index / (Math.max(logs.length - 1, 1))) * (width - padding);

    const points = logs.map((log, i) => `${getX(i)},${getY(log.bpm)}`).join(' ');

    return (
      <svg viewBox={`-10 -20 ${width + 60} ${height + 60}`} className="hr-chart-svg">
        {/* Y-Axis Grid Lines */}
        {[50, 75, 100, 125].map(val => (
           <g key={val}>
             <line x1="0" y1={getY(val)} x2={width} y2={getY(val)} stroke="#E0E0E0" strokeWidth="1" />
             <text x={width + 15} y={getY(val) + 5} fontSize="14" fill="#999" fontFamily="Poppins">{val}</text>
           </g>
        ))}

        {/* Line */}
        {logs.length > 1 && (
            <polyline points={points} fill="none" stroke="#FF3B30" strokeWidth="3" />
        )}

        {/* Dots */}
        {logs.map((log, i) => (
          <circle key={i} cx={getX(i)} cy={getY(log.bpm)} r="5" fill="#FF3B30" stroke="white" strokeWidth="2" />
        ))}

        {/* X-Axis Labels */}
        {logs.map((log, i) => (
          <text key={i} x={getX(i)} y={height + 30} fontSize="14" fill="#999" textAnchor="middle" fontFamily="Poppins">
            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="hr-page-container">
      
      <div className="hr-header">
        <button className="hr-back-btn" onClick={() => navigate('/dashboard')}>
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
         <h2>Average <span className="highlight-red">{average || 0} BPM</span></h2>
         <p className="date-range-sub">
            {logs.length > 0 
               ? `${new Date(logs[0].date).getDate()}-${new Date(logs[logs.length-1].date).getDate()} ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`
               : 'No Data'
            }
         </p>
      </div>

      <div className="chart-container">
         {renderChart()}
      </div>

      <div className="today-reading-block">
         <div className="today-header">
            <h3>Today</h3>
            <button className="add-reading-btn" onClick={() => setIsAdding(!isAdding)}>
               {isAdding ? 'Close' : <FiPlus />}
            </button>
         </div>
         
         {isAdding ? (
            <div className="add-form">
               <input type="number" placeholder="72" value={newBPM} onChange={e => setNewBPM(e.target.value)} />
               <button onClick={handleAddReading}>Save</button>
            </div>
         ) : (
            <h1 className="highlight-red">
               {todayLog.bpm || '--'} <span className="unit">BPM</span>
            </h1>
         )}
         <p className="date-sub">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default HeartRate;