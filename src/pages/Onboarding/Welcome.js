import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Welcome.css';

// 1. UPDATED IMPORT NAME
import tomatoHero from '../../assets/raise-hand.png'; 

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      {/* Image Section */}
      <div className="hero-section">
        <img 
          src={tomatoHero} 
          alt="Tomato Superhero" 
          className="hero-image" 
        />
      </div>

      {/* Text Section */}
      <div className="text-section">
        <h1>
          Time to<br />
          “ketchup” on<br />
          your wellness
        </h1>
      </div>
        
      {/* Button Section */}
      <div className="button-group">
        <button 
          className="btn btn-signup" 
          onClick={() => navigate('/signup')}
        >
          Sign up
        </button>

        <button 
          className="btn btn-signin" 
          onClick={() => navigate('/signin')}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default Welcome;