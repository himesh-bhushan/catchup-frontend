import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Display = () => {
  const navigate = useNavigate();
  // ✅ 1. Get Theme State
  const { fontSize, setFontSize, theme, setTheme } = useTheme(); 
  const { t, i18n } = useTranslation();

  // --- DEFINITIONS ---
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文 (Chinese)' },
    { code: 'ms', label: 'Bahasa Melayu' }
  ];

  const themes = [
    { code: 'light', label: 'Light Mode' },
    { code: 'dark', label: 'Dark Mode' },
    { code: 'contrast', label: 'High Contrast' }
  ];

  // --- HELPERS ---
  const handleLanguageChange = (e) => i18n.changeLanguage(e.target.value);
  
  const getCurrentLanguageLabel = () => {
    const found = languages.find(l => l.code === i18n.language);
    return found ? found.label : 'English';
  };

  const getCurrentThemeLabel = () => {
    const found = themes.find(th => th.code === theme);
    // If no theme is set yet, default to Light Mode label
    return found ? found.label : 'Light Mode';
  };

  // --- SLIDER LOGIC ---
  const getSliderValue = (px) => {
    if (px <= 12) return 1; if (px <= 14) return 2; if (px <= 16) return 3;
    if (px <= 18) return 4; if (px <= 20) return 5; return 6;
  };
  const getPxFromSlider = (val) => {
    const map = { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24 };
    return map[val] || 16;
  };

  return (
    <div className="display-section-wrapper">
      
      {/* Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiArrowLeft 
              className="mobile-back-btn" 
              size={24}
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate('/profile')} 
            />
            <h2>{t('display_title')}</h2>
        </div>
      </div>

      {/* 1. Text Size Card */}
      <div className="display-card text-size-card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
             <label className="card-label">{t('text_size')}</label>
             <span style={{fontSize:'0.9rem', color:'#888'}}>
                 {fontSize === 16 ? t('standard') : fontSize > 16 ? t('large') : t('small')}
             </span>
        </div>
        
        <div className="slider-row">
           <span className="font-icon-small">A</span>
           <div className="range-wrapper">
             <input 
               type="range" min="1" max="6" step="1"
               value={getSliderValue(fontSize)}
               onChange={(e) => setFontSize(getPxFromSlider(parseInt(e.target.value)))}
               className="custom-range"
             />
           </div>
           <span className="font-icon-large">A</span>
        </div>
      </div>

      {/* --- 2. LANGUAGE PILL --- */}
      <div className="display-pill" style={{ position: 'relative' }}>
         <span className="pill-label">{t('language')}</span>
         <div className="pill-right">
            <span className="pill-value">{getCurrentLanguageLabel()}</span>
            <FiChevronRight size={20} color="#ccc" />
         </div>

         {/* Hidden Select for Language */}
         <select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{
                position: 'absolute', top: 0, right: 0, width: '160px', height: '100%',
                opacity: 0, cursor: 'pointer', appearance: 'none'
            }}
         >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
         </select>
      </div>

      {/* --- 3. THEME PILL (Now Functional) --- */}
      <div className="display-pill" style={{ position: 'relative' }}>
         <span className="pill-label">{t('theme')}</span>
         <div className="pill-right">
            {/* Shows current theme label */}
            <span className="pill-value">{getCurrentThemeLabel()}</span>
            <FiChevronRight size={20} color="#ccc" />
         </div>

         {/* Hidden Select for Theme */}
         <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)} // ✅ Updates Global Theme
            style={{
                position: 'absolute', top: 0, right: 0, width: '160px', height: '100%',
                opacity: 0, cursor: 'pointer', appearance: 'none'
            }}
         >
            {themes.map((th) => (
                <option key={th.code} value={th.code}>{th.label}</option>
            ))}
         </select>
      </div>

    </div>
  );
};

export default Display;