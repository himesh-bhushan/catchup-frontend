import React, { createContext, useState, useContext, useCallback } from 'react';
import './Notification.css'; // We will create this next

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  // Function to show notification
  // type can be 'success', 'error', or 'info'
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* THE ACTUAL POPUP COMPONENT */}
      {notification && (
        <div className={`notification-toast ${notification.type} animate-slide-in`}>
           <span className="toast-icon">
             {notification.type === 'success' && '✅'}
             {notification.type === 'error' && '⚠️'}
             {notification.type === 'info' && 'ℹ️'}
           </span>
           <span className="toast-message">{notification.message}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};