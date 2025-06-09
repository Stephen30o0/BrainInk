import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ProfileCustomizationModalContextType {
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  profileUpdateKey: number;
  notifyProfileUpdate: () => void;
}

const ProfileCustomizationModalContext = createContext<ProfileCustomizationModalContextType | undefined>(undefined);

export const ProfileCustomizationModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUpdateKey, setProfileUpdateKey] = useState(0);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);
  const notifyProfileUpdate = () => setProfileUpdateKey(prevKey => prevKey + 1);

  return (
    <ProfileCustomizationModalContext.Provider value={{ isProfileModalOpen, openProfileModal, closeProfileModal, profileUpdateKey, notifyProfileUpdate }}>
      {children}
    </ProfileCustomizationModalContext.Provider>
  );
};

export const useProfileCustomizationModal = () => {
  const context = useContext(ProfileCustomizationModalContext);
  if (context === undefined) {
    throw new Error('useProfileCustomizationModal must be used within a ProfileCustomizationModalProvider');
  }
  return context;
};
