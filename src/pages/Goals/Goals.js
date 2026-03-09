import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiEdit2, FiCheck, FiMoon, FiDroplet, FiTarget, FiActivity } from 'react-icons/fi';
import { supabase } from '../../supabase';

// ✅ Import Navigation Bar
import DashboardNav from '../../components/DashboardNav';

import './Goals.css';

// Images
import tomatoGym from '../../assets/tomato-health.png';

const DEFAULT_GOALS = {
  steps_current: 0, steps_target: 5000,
  sleep_current: 0, sleep_target: 7,
  move_current: 0, move_target: 500, // Replaced exercise with move (calories)
  water_current: 0, water_target: 2
};

const Goals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  // --- 1. Fetch Real Data (Synced with Dashboard) ---
  useEffect(() => {
    let mounted = true;
    const fetchGoals = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const isToday = date === new Date().toISOString().split('T')[0];

        // Fetch Profile Data (for targets and today's quick stats)
        const { data: profile } = await supabase.from('profiles').select('calorie_goal, sleep_seconds, water_intake').eq('id', user.id).single();
        
        // Fetch Activity Logs (Steps & Move Ring)
        const { data: activity } = await supabase.from('activity_logs').select('steps, calories').eq('user_id', user.id).eq('date', date).maybeSingle();
        
        // Fetch Sleep Logs
        let sleepHrs = 0;
        if (isToday && profile?.sleep_seconds) sleepHrs = profile.sleep_seconds / 3600;
        else {
            const { data: sleepLog } = await supabase.from('sleep_logs').select('hours, seconds').eq('user_id', user.id).eq('date', date).maybeSingle();
            if (sleepLog) sleepHrs = sleepLog.hours ? sleepLog.hours : (sleepLog.seconds / 3600);
        }

        // Fetch Water Logs
        let waterL = 0;
        if (isToday && profile?.water_intake) waterL = profile.water_intake / 1000;
        else {
            const { data: waterLog } = await supabase.from('water_logs').select('water_ml').eq('user_id', user.id).eq('date', date).maybeSingle();
            if (waterLog) waterL = waterLog.water_ml / 1000;
        }

        if (mounted) {
            setGoals({
                steps_current: activity?.steps || 0,
                steps_target: 5000, // Matching dashboard target
                move_current: activity?.calories || 0,
                move_target: profile?.calorie_goal || 500, // Matching dashboard target
                sleep_current: parseFloat(sleepHrs.toFixed(1)),
                sleep_target: 7, // Matching dashboard target
                water_current: parseFloat(waterL.toFixed(1)),
                water_target: 2 // Matching dashboard target
            });
        }
      } catch (err) {
        console.error("Error fetching goals:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchGoals();
    return () => { mounted = false; };
  }, [date]);

  // --- 2. Update Real Data ---
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const isToday = date === new Date().toISOString().split('T')[0];
    
    try {
      // Save Activity (Steps & Move Ring)
      await supabase.from('activity_logs').upsert({
          user_id: user.id, date: date, steps: goals.steps_current, calories: goals.move_current
      }, { onConflict: 'user_id,date' });

      // Save Sleep
      await supabase.from('sleep_logs').upsert({
          user_id: user.id, date: date, hours: goals.sleep_current, seconds: Math.round(goals.sleep_current * 3600)
      }, { onConflict: 'user_id,date' });

      // Save Water
      await supabase.from('water_logs').upsert({
          user_id: user.id, date: date, water_ml: Math.round(goals.water_current * 1000)
      }, { onConflict: 'user_id,date' });

      // If updating today's data, also push it to the main profile to immediately update the Dashboard preview
      if (isToday) {
          await supabase.from('profiles').update({
              sleep_seconds: Math.round(goals.sleep_current * 3600),
              water_intake: Math.round(goals.water_current * 1000),
              calorie_goal: goals.move_target // Allows user to adjust their move goal ring!
          }).eq('id', user.id);
      }

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Error saving goals");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: Number(value) }));
  };

  // --- 3. Data Formatting ---
  const countCompleted = () => {
    let count = 0;
    if (goals.steps_current >= goals.steps_target) count++;
    if (goals.sleep_current >= goals.sleep_target) count++;
    if (goals.move_current >= goals.move_target) count++;
    if (goals.water_current >= goals.water_target) count++;
    return count;
  };

  const goalData = [
    { id: 'steps', title: 'Meet step count', currentKey: 'steps_current', targetKey: 'steps_target', unit: 'steps', icon: <FiActivity /> },
    { id: 'sleep', title: 'Sleep duration', currentKey: 'sleep_current', targetKey: 'sleep_target', unit: 'hours', icon: <FiMoon /> },
    { id: 'move', title: 'Complete Move Ring', currentKey: 'move_current', targetKey: 'move_target', unit: 'kcal', icon: <FiTarget /> },
    { id: 'water', title: 'Water intake', currentKey: 'water_current', targetKey: 'water_target', unit: 'Liters', icon: <FiDroplet /> }
  ];

  const inProgressGoals = goalData.filter(g => goals[g.currentKey] < goals[g.targetKey]);
  const completedGoals = goalData.filter(g => goals[g.currentKey] >= goals[g.targetKey]);

  // --- 4. Card Component ---
  const GoalCard = ({ item, isCompleted }) => {
    const current = goals[item.currentKey];
    const target = goals[item.targetKey];
    const pct = target ? Math.min((current / target) * 100, 100) : 0;
    
    return (
      <div className={`new-goal-card ${isCompleted ? 'completed-card' : 'in-progress-card'}`}>
        <div className="card-top">
          <div className="card-icon">{item.icon}</div>
          <h4>{item.title}</h4>
        </div>
        
        <div className="card-progress-wrapper">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
          </div>
          
          {isEditing ? (
              <div className="progress-text-overlay" style={{ zIndex: 10, pointerEvents: 'auto' }}>
                  <div className="edit-inputs" onClick={(e) => e.stopPropagation()}>
                    <input type="number" name={item.currentKey} value={current} onChange={handleChange} style={{width: '60px'}} />
                    <span>/</span>
                    <input type="number" name={item.targetKey} value={target} onChange={handleChange} disabled={item.id !== 'move'} style={{width: '60px', opacity: item.id !== 'move' ? 0.7 : 1}} />
                  </div>
              </div>
          ) : (
              <>
                  {/* Bottom Text: Black (Shows over the empty white bar) */}
                  <div className="progress-text-overlay text-black">
                      <span>{current} / {target} {item.unit}</span>
                  </div>
                  
                  {/* Top Text: Pure White (Clipped perfectly to match the colored bar's width!) */}
                  <div className="progress-text-overlay text-white" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
                      <span>{current} / {target} {item.unit}</span>
                  </div>
              </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper goals-page-bg">
        <DashboardNav />
        <div className="dashboard-content flex-center">
          <h2 style={{color: '#FF3B30'}}>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper goals-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="goals-page-container">
          {/* HEADER */}
          <div className="goals-header-new">
             <div className="header-left">
                 <button onClick={() => navigate('/dashboard')} className="icon-btn"><FiArrowLeft size={24} /></button>
                 <h2>{date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short'})}</h2>
                 
                 {/* Fixed invisible native calendar picker */}
                 <div className="date-picker-wrapper" style={{position: 'relative'}}>
                     <button className="icon-btn" onClick={() => document.getElementById('goalsDatePicker').showPicker()} style={{width: 40, height: 40, border: 'none', background: 'transparent', cursor: 'pointer'}}>
                        <FiCalendar size={20} />
                     </button>
                     <input 
                        id="goalsDatePicker"
                        type="date" 
                        value={date} 
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)} 
                        style={{position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none'}}
                     />
                 </div>
             </div>
             <button className="icon-btn edit-toggle" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
               {isEditing ? <FiCheck size={22} color="#4CD964" /> : <FiEdit2 size={22} />}
             </button>
          </div>

          <div className="goals-content-new">
              {/* HERO BANNER */}
              <div className="goals-hero-banner">
                  <div className="hero-text">
                      <p>Every healthy choice counts.</p>
                      <h1>{countCompleted()}/4 Goals Completed</h1>
                  </div>
                  <img src={tomatoGym} alt="Working out" className="hero-image" />
              </div>

              {/* IN PROGRESS SECTION */}
              {inProgressGoals.length > 0 && (
                  <div className="goal-section">
                      <h3 className="section-title">In Progress</h3>
                      <div className="goals-grid">
                          {inProgressGoals.map(item => (
                              <GoalCard key={item.id} item={item} isCompleted={false} />
                          ))}
                      </div>
                  </div>
              )}

              {/* COMPLETED SECTION */}
              {completedGoals.length > 0 && (
                  <div className="goal-section">
                      <h3 className="section-title">Completed</h3>
                      <div className="goals-grid completed-grid">
                          {completedGoals.map(item => (
                              <GoalCard key={item.id} item={item} isCompleted={true} />
                          ))}
                      </div>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;