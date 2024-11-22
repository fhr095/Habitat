// src/App.js

import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  // Estados
  const [buttonActive, setButtonActive] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [activeTouches, setActiveTouches] = useState([]);

  // Referência para o temporizador de movimento
  const moveTimeout = useRef(null);

  // Referência para o elemento do botão
  const buttonRef = useRef(null);

  // Configurações do botão
  const buttonRadius = 50; // Personalize o raio aqui
  const buttonPosition = { top: '200px', left: '200px' }; // Personalize a posição aqui

  // Função para verificar se o evento ocorreu dentro do botão
  const isEventInsideButton = (event) => {
    const button = buttonRef.current;
    if (!button) return false;
    const rect = button.getBoundingClientRect();

    let x, y;
    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else if (event.clientX !== undefined && event.clientY !== undefined) {
      x = event.clientX;
      y = event.clientY;
    } else {
      return false;
    }

    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  };

  // Função para atualizar os toques ativos
  const updateActiveTouches = (touches) => {
    const touchPositions = Array.from(touches).map((touch) => ({
      x: touch.clientX,
      y: touch.clientY,
    }));
    setActiveTouches(touchPositions);
  };

  // Handlers de toque
  const handleTouchStart = (event) => {
    setTouchCount(event.touches.length);
    updateActiveTouches(event.touches);

    if (isEventInsideButton(event)) {
      setButtonActive(true);
      setIsMoving(false);
    }
  };

  const handleTouchMove = (event) => {
    setIsMoving(true);
    updateActiveTouches(event.touches);

    // Reinicia o temporizador de movimento
    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => {
      setIsMoving(false);
    }, 100);
  };

  const handleTouchEnd = (event) => {
    setTouchCount(event.touches.length);
    updateActiveTouches(event.touches);

    // Se não houver mais toques, redefina os estados
    if (event.touches.length === 0) {
      setButtonActive(false);
      setIsMoving(false);
      setActiveTouches([]);

      // Limpa o temporizador de movimento
      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
        moveTimeout.current = null;
      }
    }
  };

  // Handlers de mouse
  const handleMouseDown = (event) => {
    setTouchCount(1);
    updateActiveTouches([event]);

    if (isEventInsideButton(event)) {
      setButtonActive(true);
      setIsMoving(false);
    }
  };

  const handleMouseMove = (event) => {
    if (event.buttons === 1) { // Verifica se o botão do mouse está pressionado
      setIsMoving(true);
      updateActiveTouches([event]);

      // Reinicia o temporizador de movimento
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    }
  };

  const handleMouseUp = (event) => {
    setButtonActive(false);
    setIsMoving(false);
    setTouchCount(0);
    setActiveTouches([]);

    // Limpa o temporizador de movimento
    if (moveTimeout.current) {
      clearTimeout(moveTimeout.current);
      moveTimeout.current = null;
    }
  };

  return (
    <div
      className="App"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Botão circular */}
      <div
        className="circle-button"
        ref={buttonRef}
        style={{
          width: `${buttonRadius * 2}px`,
          height: `${buttonRadius * 2}px`,
          borderRadius: `${buttonRadius}px`,
          top: buttonPosition.top,
          left: buttonPosition.left,
        }}
      ></div>

      {/* Sinalizador de botão ativo */}
      {buttonActive && <div className="indicator active">Botão Ativo</div>}

      {/* Sinalizador de movimento */}
      {isMoving && <div className="indicator moving">Movendo</div>}

      {/* Sinalizador de quantidade de toques */}
      <div className="indicator touch-count">Toques: {touchCount}</div>

      {/* Regiões ativas dos toques */}
      {activeTouches.map((touch, index) => (
        <div
          key={index}
          className="touch-region"
          style={{
            top: `${touch.y - 50}px`,
            left: `${touch.x - 50}px`,
          }}
        ></div>
      ))}
    </div>
  );
}

export default App;
