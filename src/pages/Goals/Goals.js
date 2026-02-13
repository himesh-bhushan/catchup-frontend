import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiEdit2, FiCheck } from 'react-icons/fi';
import { supabase } from '../../supabase';
import './Goals.css';

// Images
import tomatoSteps from '../../assets/tomato-run.png';
import tomatoSleep from '../../assets/tomato-sleep.png';
import tomatoGym from '../../assets/tomato-gym.png';
import tomatoWater from '../../assets/tomato-water.png';
import tomatoWinner from '../../assets/raise-hand.png';

// ✅ FIXED: Defined outside the component to keep it stable
const DEFAULT_GOALS = {
  steps_current: 0, steps_target: 10000,
  sleep_current: 0, sleep_target: 8,
  exercise_current: 0, exercise_target: 60,
  water_current: 0, water_target: 3
};

const Goals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Use the external constant
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
          // Row missing: Insert defaults
          const { error: insertError } = await supabase
            .from('daily_goals')
            .insert({
               user_id: user.id,
               date: date,
               steps_current: 0,
               steps_target: 10000
            });
          
          // ✅ Use the external constant here too
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
  }, [date]); // ✅ Dependency array is now correct

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

  const calculateProgress = (current, target) => {
    if (!target) return 0;
    const pct = (current / target) * 100;
    return Math.min(pct, 100);
  };

  const countCompleted = () => {
    let count = 0;
    if (goals.steps_current >= goals.steps_target) count++;
    if (goals.sleep_current >= goals.sleep_target) count++;
    if (goals.exercise_current >= goals.exercise_target) count++;
    if (goals.water_current >= goals.water_target) count++;
    return count;
  };

  const GoalCard = ({ title, currentKey, targetKey, unit, icon, color }) => (
    <div className="goal-card">
      <div className="goal-icon-wrapper">
         <img src={icon} alt={title} />
      </div>
      <div className="goal-info">
        <h3>{title}</h3>
        <div className="goal-bar-container">
           <div 
             className="goal-bar-fill" 
             style={{ width: `${calculateProgress(goals[currentKey], goals[targetKey])}%`, backgroundColor: color }}
           ></div>
           <div className="goal-text-overlay">
              {isEditing ? (
                 <div className="edit-inputs">
                   <input type="number" name={currentKey} value={goals[currentKey]} onChange={handleChange} />
                   <span>/</span>
                   <input type="number" name={targetKey} value={goals[targetKey]} onChange={handleChange} />
                   <span>{unit}</span>
                 </div>
              ) : (
                 <span>{goals[currentKey]} / {goals[targetKey]} {unit}</span>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="goals-page-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
        <h2 style={{color: '#FF3B30'}}>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="goals-page-container">
      <div className="goals-header">
         <button onClick={() => navigate('/dashboard')} className="back-btn"><FiArrowLeft /></button>
         <div className="date-display">
            <h2>Today, {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
         </div>
         <div className="header-actions">
            <div className="date-picker-wrapper">
                <FiCalendar />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="hidden-date-input"/>
            </div>
            <button className="edit-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
              {isEditing ? <FiCheck /> : <FiEdit2 />}
            </button>
         </div>
      </div>

      <div className="goals-layout">
         <div className="goals-list">
            <GoalCard title="Meet step count" currentKey="steps_current" targetKey="steps_target" unit="steps" icon={tomatoSteps} color="#D32F2F" />
            <GoalCard title="Sleep duration met" currentKey="sleep_current" targetKey="sleep_target" unit="hours" icon={tomatoSleep} color="#D32F2F" />
            <GoalCard title="Go exercise for 1 hour" currentKey="exercise_current" targetKey="exercise_target" unit="min" icon={tomatoGym} color="#D32F2F" />
            <GoalCard title="Drink 3 litre of water" currentKey="water_current" targetKey="water_target" unit="litre" icon={tomatoWater} color="#D32F2F" />
         </div>

         <div className="goals-sidebar">
            <div className="goal-board-card">
               <h2>Goal Board</h2>
               <div className="board-progress-container">
                  <div className="board-bar-bg">
                     <div className="board-bar-fill" style={{ width: `${(countCompleted() / 4) * 100}%` }}></div>
                  </div>
                  <div className="tomato-marker" style={{ left: `calc(${(countCompleted() / 4) * 100}% - 20px)` }}>
                     <img src={tomatoWinner} alt="Marker" />
                  </div>
                  <span className="board-text">{countCompleted()}/4</span>
               </div>
            </div>
            <div className="gym-illustration">
                <img src={tomatoGym} alt="Working out" /> 
            </div>
         </div>
      </div>
    </div>
  );
};

export default Goals;