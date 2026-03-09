import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDroplet } from 'react-icons/fi';
import { supabase } from '../../supabase';
import DashboardNav from '../../components/DashboardNav';

// We reuse the Sleep.css classes to keep the theme perfectly consistent
import '../Sleep/Sleep.css'; 
import './Water.css'; // For the water-specific wave animation

const Water = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  
  const GOAL_LITERS = 2.5;

  const fetchWaterData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('water_intake')
        .eq('id', user.id)
        .single();
      
      setWaterMl(profile?.water_intake || 0);

    } catch (err) {
      console.error("Error fetching water data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaterData();
  }, [fetchWaterData]);

  const waterLiters = (waterMl / 1000).toFixed(1);
  const progressPercentage = Math.min((waterLiters / GOAL_LITERS) * 100, 100);

  return (
    <div className="dashboard-wrapper detail-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="detail-page-container">
          <div className="detail-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>Hydration</h2>
            <div style={{ width: 24 }}></div>
          </div>

          {loading ? (
            <div className="loading-state">Loading water data...</div>
          ) : (
            <div className="detail-content">
              
              {/* Hero Card */}
              <div className="hero-card bg-blue">
                <div className="hero-icon-wrapper">
                  <FiDroplet size={40} color="#FFF" />
                </div>
                <div className="hero-text">
                  <h3>Water Intake</h3>
                  <div className="hero-value">
                    {waterLiters} <span>LITERS</span>
                  </div>
                  <p>Goal: {GOAL_LITERS} L ({GOAL_LITERS * 1000} ml)</p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="card progress-card">
                <div className="card-header">
                  <h3>Daily Goal</h3>
                  <span className="goal-percentage">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill fill-blue" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="progress-subtitle">
                  {waterLiters >= GOAL_LITERS 
                    ? "Hydration goal met! Excellent." 
                    : `Drink ${(GOAL_LITERS - waterLiters).toFixed(1)} more Liters to hit your goal.`}
                </p>
              </div>

              {/* Water Visualizer Card */}
              <div className="card visual-card">
                <div className="card-header">
                  <h3>Current Hydration Level</h3>
                </div>
                <div className="water-bottle-container">
                    <div className="water-bottle">
                        <div 
                          className="water-liquid" 
                          style={{ height: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="water-markers">
                        <span>2.5L - Goal</span>
                        <span>1.2L - Halfway</span>
                        <span>0L - Empty</span>
                    </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Water;