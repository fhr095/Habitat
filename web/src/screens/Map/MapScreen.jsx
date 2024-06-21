import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Buttons from './components/Buttons';
import Profile from './components/Profile';
import AddHabitat from './components/AddHabitat';
import ListHabitats from './components/ListHabitats';

import LoginRegisterModal from './components/LoginRegisterModal';

import './styles/MapScreen.scss';

export default function MapScreen({ user, onLoginClick, onLogoutClick }) {
  const [activeComponent, setActiveComponent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleOpenLoginModal = () => setShowLoginModal(true);
  const handleCloseLoginModal = () => setShowLoginModal(false);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "Profile":
        return <Profile />;
      case "AddHabitat":
        return <AddHabitat user={user} />;
      case "ListHabitats":
        return <ListHabitats user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className='mapScreen-container'>
      <Sidebar setActiveComponent={setActiveComponent} />

      {renderActiveComponent()}

      <Buttons 
        logged={!!user} 
        onLoginClick={handleOpenLoginModal} 
        onLogoutClick={onLogoutClick} 
      />
      <Map />

      <LoginRegisterModal
        show={showLoginModal}
        handleClose={handleCloseLoginModal}
      />
    </div>
  );
}