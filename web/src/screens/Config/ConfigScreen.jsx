import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { getAuth } from 'firebase/auth';
import Sidebar from './components/Sidebar';

import ProfileSettings from './components/ProfileSettings';
import Habitat from './components/Habitat';
import AddWidget from './components/AddWidget';

import './styles/ConfigScreen.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      case 'add-widget':
        return <AddWidget />;
      case 'habitat':
        return <Habitat />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <Container fluid className="config-screen">
        <Sidebar className="sidebar" setActiveTab={setActiveTab} profileImageUrl={profileImageUrl} />
          {renderActiveTab()}
    </Container>
  );
}