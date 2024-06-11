import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeScreen.scss';

export default function HomeScreen() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/scene'); // Redirecionar para a plataforma
  };

  return (
    <div className="home-screen">
      <header className="header">
        <div className="logo">Logo</div>
        <button className="access-platform-button" onClick={handleNavigate}>
          Acessar Plataforma
        </button>
      </header>
      <div className="content-container">
        <div className="text-container">
          <h1>Bem-vindo à Nossa Plataforma</h1>
          <p>
            Aqui você encontrará as melhores ferramentas para gerenciar e visualizar seus projetos. Nossa plataforma oferece uma interface intuitiva e recursos avançados para facilitar seu trabalho.
          </p>
        </div>
        <div className="video-container">
          <video controls>
            <source src="your-video-url.mp4" type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>
      </div>
    </div>
  );
}