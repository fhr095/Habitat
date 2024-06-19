import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { getAuth } from 'firebase/auth';
import Sidebar from '../components/Sidebar';
import ProfileSettings from '../components/ProfileSettings';
import AddWidget from '../components/AddWidget';
import '../styles/ConfigScreen.scss';

export default function ConfigScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setProfileImageUrl(user.photoURL);
    }
  }, [user]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'add-widget':  // Aqui deve ser 'add-widget' para corresponder à Sidebar
        return <AddWidget />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="config-screen">
      <Sidebar setActiveTab={setActiveTab} profileImageUrl={profileImageUrl} />
      <div className="content">
        {renderActiveTab()}
      </div>
    </div>
  );
}