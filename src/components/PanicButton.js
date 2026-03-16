import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; 
import { FiX } from 'react-icons/fi';
import './PanicButton.css';
import panicBtnImg from '../assets/PanicButton.png'; 

const PanicButton = () => {
  const location = useLocation(); 
  const [panicMode, setPanicMode] = useState(false);
  const [breathText, setBreathText] = useState("Breathe In");

  // --- BREATHING TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (panicMode) {
      let phase = 0; // 0: In, 1: Hold, 2: Out
      setBreathText("Breathe In"); 
      
      interval = setInterval(() => {
        phase = (phase + 1) % 3;
        if (phase === 0) setBreathText("Breathe In");
        else if (phase === 1) setBreathText("Hold");
        else if (phase === 2) setBreathText("Breathe Out");
      }, 4000); 
    }
    return () => clearInterval(interval);
  }, [panicMode]);

  // --- HIDE LOGIC ---
  const hiddenRoutes = ['/signin', '/signup', '/', '/welcome'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  // Check if current route is the dashboard. 
  // ⚠️ NOTE: Change '/dashboard' to whatever your actual dashboard URL path is!
  const isDashboard = location.pathname === '/dashboard';

  return (
    <>
      {/* GLOBAL PANIC BUTTON - dynamically adds 'hide-on-mobile' if not on dashboard */}
      <button 
        className={`global-panic-btn ${!isDashboard ? 'hide-on-mobile' : ''}`} 
        onClick={() => setPanicMode(true)}
      >
        <img src={panicBtnImg} alt="Panic" /> 
      </button>
      <div className="panic-bubble">
        Panic Button
      </div>

      {/* GLOBAL OVERLAY */}
      {panicMode && (
          <div className="panic-overlay">
              {/* 1. Circle is now FIRST (Top) */}
              <div className="breathing-circle-wrapper">
                  <div className="breathing-circle"></div>
                  <div className="breathing-text">{breathText}</div>
              </div>

              {/* 2. Button is now SECOND (Bottom) */}
              <button className="close-panic-btn" onClick={() => setPanicMode(false)}>
                  <FiX size={24} /> I'm Calm Now
              </button>
          </div>
      )}
    </>
  );
};

export default PanicButton;