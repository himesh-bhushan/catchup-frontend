import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import PersonalDetails from './sections/PersonalDetails';
import MedicalID from './sections/MedicalID';
import Display from './sections/Display';
import Notifications from './sections/Notifications';
import ConnectedApps from './sections/Apps'; 
import './Profile.css';

const ProfileLayout = () => {
  const location = useLocation();
  const isRootProfile = location.pathname === '/profile';
  const viewClass = isRootProfile ? 'viewing-menu' : 'viewing-content';

  return (
    <div className={`profile-wrapper ${viewClass}`}>
      <ProfileMenu />

      <div className="profile-content-side">
        <Routes>
          <Route path="/" element={<PersonalDetails />} />
          <Route path="details" element={<PersonalDetails />} />
          <Route path="medical" element={<MedicalID />} />
          <Route path="display" element={<Display />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="apps" element={<ConnectedApps />} />
          
          
          
          <Route path="*" element={<div>Section coming soon...</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default ProfileLayout;