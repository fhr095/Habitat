import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { getAuth } from 'firebase/auth';
import Sidebar from '../components/Sidebar';
import ProfileSettings from '../components/ProfileSettings';
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
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="config-screen">
      <div className="sidebar">
        <Sidebar setActiveTab={setActiveTab} profileImageUrl={profileImageUrl} />
      </div>
      <div className="content">
        {renderActiveTab()}
      </div>
    </div>
  );
}