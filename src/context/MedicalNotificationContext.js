import React, { createContext, useState, useContext } from 'react';
import './MedicalNotification.css';

const MedicalNotificationContext = createContext();

export const useMedicalNotification = () => useContext(MedicalNotificationContext);

export const MedicalNotificationProvider = ({ children }) => {
  // ✅ 1. Initialize State with ALL fields (including new ones)
  const [medicalData, setMedicalData] = useState({
    name: localStorage.getItem('userName') || "Friend",
    age: "25",
    bloodGroup: "O+",
    allergies: "None",           
    conditions: "None",          
    emergencyContact: "None"     
  });

  const [isLockedVisible, setIsLockedVisible] = useState(false);

  // Helper to update state from the settings page
  const updateMedicalData = (newData) => {
    setMedicalData(prev => ({ ...prev, ...newData }));
  };

  // ✅ 2. Trigger System Notification with Full Details
  const triggerSystemNotification = async () => {
    // A. Check Browser Support
    if (!("Notification" in window)) {
      alert("This browser does not support system notifications.");
      return;
    }

    // B. Request Permission
    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    // C. Send Notification
    if (permission === "granted") {
      
      // Format the text to look clean on a lock screen
      const bodyText = 
        `🩸 Blood: ${medicalData.bloodGroup} | Age: ${medicalData.age}\n` +
        `📞 SOS: ${medicalData.emergencyContact}\n` +
        `⚠️ Allergies: ${medicalData.allergies}\n` +
        `🏥 Conditions: ${medicalData.conditions}`;

      // Option 1: Service Worker (Better for Mobile/PWA)
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
         navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Medical ID (Emergency Info)", {
               body: bodyText,
               icon: '/logo192.png', // Ensure you have this image in public folder
               tag: 'medical-id-notification', // Replaces old notification if a new one comes
               requireInteraction: true, // Tries to keep it on screen longer
               silent: false
            });
         });
      } else {
         // Option 2: Standard Desktop Notification
         new Notification("Medical ID (Emergency Info)", {
            body: bodyText,
            icon: '/logo192.png',
            requireInteraction: true
         });
      }
    }
  };

  return (
    <MedicalNotificationContext.Provider value={{ 
       medicalData, 
       updateMedicalData, 
       isLockedVisible, 
       setIsLockedVisible,
       triggerSystemNotification
    }}>
      {children}
      
      {/* --- IN-APP STICKY BAR (Red Emergency Strip) --- */}
      {isLockedVisible && (
        <div className="medical-id-sticky-bar animate-slide-down">
           <div className="medical-icon-pulse">⛑️</div>
           <div className="medical-info-row">
              <span className="med-label">NAME:</span> <strong>{medicalData.name}</strong>
              <span className="med-divider">|</span>
              <span className="med-label">BLOOD:</span> <strong>{medicalData.bloodGroup}</strong>
              <span className="med-divider">|</span>
              {/* Show SOS in the bar too if space permits */}
              <span className="med-label">SOS:</span> <strong>{medicalData.emergencyContact}</strong>
           </div>
        </div>
      )}
    </MedicalNotificationContext.Provider>
  );
};