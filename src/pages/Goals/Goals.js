import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiEdit2, FiCheck, FiMoon, FiDroplet, FiTarget, FiActivity } from 'react-icons/fi';
import { supabase } from '../../supabase';
import './Goals.css';

// Images
import tomatoGym from '../../assets/tomato-health.png';

const DEFAULT_GOALS = {
  steps_current: 0, steps_target: 10000,
  sleep_current: 0, sleep_target: 8,
  exercise_current: 0, exercise_target: 1, // Assuming hours to match mockup
  water_current: 0, water_target: 3
};

const Goals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  // --- 1. Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchGoals = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        if (error && error.code !== 'PGRST116') throw error; 

        if (data) {
          if (mounted) setGoals(data);
        } else {
          const { error: insertError } = await supabase
            .from('daily_goals')
            .insert({
               user_id: user.id,
               date: date,
               steps_current: 0,
               steps_target: 10000
            });
          if (!insertError && mounted) {
             setGoals({ ...DEFAULT_GOALS }); 
          }
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

  // --- 2. Update Data ---
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({
          steps_current: goals.steps_current, steps_target: goals.steps_target,
          sleep_current: goals.sleep_current, sleep_target: goals.sleep_target,
          exercise_current: goals.exercise_current, exercise_target: goals.exercise_target,
          water_current: goals.water_current, water_target: goals.water_target,
        })
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
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
    if (goals.exercise_current >= goals.exercise_target) count++;
    if (goals.water_current >= goals.water_target) count++;
    return count;
  };

  const goalData = [
    { id: 'steps', title: 'Meet step count', currentKey: 'steps_current', targetKey: 'steps_target', unit: 'steps', icon: <FiActivity /> },
    { id: 'sleep', title: 'Sleep duration', currentKey: 'sleep_current', targetKey: 'sleep_target', unit: 'hours', icon: <FiMoon /> },
    { id: 'exercise', title: 'Workout session', currentKey: 'exercise_current', targetKey: 'exercise_target', unit: 'hour', icon: <FiTarget /> },
    { id: 'water', title: 'Water intake', currentKey: 'water_current', targetKey: 'water_target', unit: 'litre', icon: <FiDroplet /> }
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
          
          <div className="progress-text-overlay">
            {isEditing ? (
                <div className="edit-inputs" onClick={(e) => e.stopPropagation()}>
                  <input type="number" name={item.currentKey} value={current} onChange={handleChange} />
                  <span>/</span>
                  <input type="number" name={item.targetKey} value={target} onChange={handleChange} />
                </div>
            ) : (
                <span>{current} / {target} {item.unit}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="goals-page-container flex-center">
        <h2 style={{color: '#FF3B30'}}>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="goals-page-container">
      {/* HEADER */}
      <div className="goals-header-new">
         <div className="header-left">
             <button onClick={() => navigate('/dashboard')} className="icon-btn"><FiArrowLeft size={24} /></button>
             <h2>Today, {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
             <div className="date-picker-wrapper">
                 <FiCalendar size={20} />
                 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="hidden-date-input"/>
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
  );
};

export default Goals;