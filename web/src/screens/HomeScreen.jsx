import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeScreen.scss';

export default function HomeScreen({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCreateHabitat = () => {
    // Lógica para criar um novo habitat
  };

  const handleNavigateToSeplag = () => {
    navigate('/');
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <div className="profile-section">
          <div className="profile-image" style={{ backgroundImage: `url(${user?.profileImageUrl || 'default-profile.png'})` }}></div>
          <span className="profile-name">{user?.name || 'Usuário'}</span>
        </div>
        <button className="create-habitat-button" onClick={handleCreateHabitat}>
          <span className="create-icon">+</span> Criar novo habitat
        </button>
      </div>
      <div className="main-content">
        <input
          type="text"
          className="search-bar"
          placeholder="Navegue pelos Habitats"
        />
        <div className="habitat-list">
          <button className="habitat-item" onClick={handleNavigateToSeplag}>SEPLAG</button>
        </div>
      </div>
    </div>
  );
}