import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Buttons from './components/Buttons';

import Profile from './components/Profile';
import AddHabitat from './components/AddHabitat';
import ListHabitats from './components/ListHabitats';

import './styles/MapScreen.scss';

export default function MapScreen({ user, onLoginClick, onLogoutClick }) {
  const [activeComponent, setActiveComponent] = useState(null);

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
      <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
      
      {renderActiveComponent()}

      <Buttons 
        logged={!!user} 
        onLoginClick={onLoginClick} 
        onLogoutClick={onLogoutClick} 
      />
      <Map />
    </div>
  );
}