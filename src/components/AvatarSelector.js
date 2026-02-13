import React, { useState } from 'react';
import { supabase } from '../supabase';
import { FiCamera, FiUser } from 'react-icons/fi';
import './AvatarSelector.css';

// ✅ Import your default avatar assets
import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const DEFAULT_AVATARS = [avatar1, avatar2, avatar3];

const AvatarSelector = ({ currentAvatarUrl, onAvatarChange }) => {
  const [uploading, setUploading] = useState(false);

  // --- HELPER: Upload File & Return Public URL ---
  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Upload to the 'avatar' bucket (singular)
    let { error: uploadError } = await supabase.storage
      .from('avatar') 
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get the Public URL so the app can display it immediately
    const { data } = supabase.storage.from('avatar').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- HANDLER: Select Default Avatar ---
  const handleDefaultSelect = async (imgSrc) => {
    if (uploading) return;
    try {
      setUploading(true);

      // Convert local asset to a File object for uploading
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const file = new File([blob], "default-avatar.png", { type: blob.type });

      const publicUrl = await uploadToSupabase(file);
      onAvatarChange(publicUrl);

    } catch (error) {
      console.error("Error setting default avatar:", error);
      alert(`Upload failed: ${error.message || "Check Supabase Storage Policies"}`);
    } finally {
      setUploading(false);
    }
  };

  // --- HANDLER: Upload Custom Photo ---
  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const publicUrl = await uploadToSupabase(file);
      
      onAvatarChange(publicUrl);

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-selector-container">
      {/* Main Preview Circle */}
      <div className="main-avatar-wrapper">
        {uploading ? (
            <div className="main-avatar-placeholder">
                <div className="avatar-spinner"></div>
            </div>
        ) : currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar" className="main-avatar-image" />
        ) : (
          <div className="main-avatar-placeholder">
            <FiUser size={60} />
          </div>
        )}
        
        {/* Camera Overlay for Custom Upload */}
        <label htmlFor="single" className="upload-overlay">
          <FiCamera size={24} />
        </label>
        <input
          style={{ visibility: 'hidden', position: 'absolute' }}
          type="file"
          id="single"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>

      {/* Default Avatar Selection Row */}
      <div className="default-avatars-list">
        <p>Choose a default:</p>
        <div className="avatars-row">
          {DEFAULT_AVATARS.map((imgSrc, index) => (
            <div 
                key={index} 
                className={`default-avatar-option ${currentAvatarUrl === imgSrc ? 'selected' : ''}`}
                onClick={() => handleDefaultSelect(imgSrc)}
            >
                <img src={imgSrc} alt={`Default ${index}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;