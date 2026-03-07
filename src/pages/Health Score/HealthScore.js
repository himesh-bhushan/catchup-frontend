import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiHeart, FiMoon, FiActivity, FiDroplet } from 'react-icons/fi';

// ✅ Import Navigation Bar
import DashboardNav from '../../components/DashboardNav';

import './HealthScore.css';

const HealthScore = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // SVG Donut Chart Configuration
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91
  
  return (
    // ✅ Reused Dashboard Wrappers to hold the Nav Bar
    <div className="dashboard-wrapper hs-page-bg">
      <DashboardNav />
      <div className="dashboard-content">
        
        <div className="hs-page-container">
          {/* Header */}
          <div className="hs-header">
            <button onClick={() => navigate('/dashboard')} className="icon-btn">
              <FiArrowLeft size={24} />
            </button>
            <h2>Today, {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
            <div className="date-picker-wrapper">
              <FiCalendar size={20} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="hidden-date-input"
              />
            </div>
          </div>

          {/* Main Split Content */}
          <div className="hs-content">
            
            {/* LEFT COLUMN: Donut Chart & Legend */}
            <div className="hs-left-col">
              <div className="hs-donut-container">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="hs-donut-svg">
                  <circle cx="50" cy="50" r={radius} className="hs-segment pink"
                    strokeDasharray={`45 ${circumference}`} strokeDashoffset={-165} />
                  <circle cx="50" cy="50" r={radius} className="hs-segment red"
                    strokeDasharray={`80 ${circumference}`} strokeDashoffset={-85} />
                  <circle cx="50" cy="50" r={radius} className="hs-segment orange"
                    strokeDasharray={`65 ${circumference}`} strokeDashoffset={-25} />
                  <circle cx="50" cy="50" r={radius} className="hs-segment yellow"
                    strokeDasharray={`35 ${circumference}`} strokeDashoffset={10} />
                </svg>
                <div className="hs-donut-text">87%</div>
              </div>

              <div className="hs-legend-grid">
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-red"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Heart Rate</span>
                    <span className="hs-legend-desc">Steady as Sauce</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-yellow"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Calories Burned</span>
                    <span className="hs-legend-desc">Simmering</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-orange"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Sleep Hours</span>
                    <span className="hs-legend-desc">Snooze approved</span>
                  </div>
                </div>
                <div className="hs-legend-item">
                  <div className="hs-legend-bar bg-pink"></div>
                  <div className="hs-legend-text">
                    <span className="hs-legend-title">Water Intake</span>
                    <span className="hs-legend-desc">Hydrated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Metric Pills */}
            <div className="hs-right-col">
              <div className="hs-big-pill pill-red">
                <div className="hs-icon-circle"><FiHeart size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Heart Rate</span>
                  <span className="hs-pill-value">80 <strong>BPM</strong></span>
                </div>
              </div>

              <div className="hs-big-pill pill-orange">
                <div className="hs-icon-circle"><FiMoon size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Sleep Hours</span>
                  <span className="hs-pill-value">190 <strong>hours</strong></span>
                </div>
              </div>

              <div className="hs-big-pill pill-yellow">
                <div className="hs-icon-circle"><FiActivity size={24} color="#000" /></div>
                <div className="hs-pill-text text-black">
                  <span className="hs-pill-label">Calories Burned</span>
                  <span className="hs-pill-value">15000 <strong>KCAL</strong></span>
                </div>
              </div>

              <div className="hs-big-pill pill-blue">
                <div className="hs-icon-circle"><FiDroplet size={24} color="#000" /></div>
                <div className="hs-pill-text">
                  <span className="hs-pill-label">Water Intake</span>
                  <span className="hs-pill-value">78 <strong>L</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default HealthScore;