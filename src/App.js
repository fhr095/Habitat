// src/App.js

import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  // Estados
  const [buttonActive, setButtonActive] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [activeTouches, setActiveTouches] = useState([]);
  const [eventIndicators, setEventIndicators] = useState({});
  const [usePointerEvents, setUsePointerEvents] = useState(false); // Toggle entre eventos

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

  // Função para acender indicadores de eventos
  const triggerEventIndicator = (eventName) => {
    setEventIndicators((prevIndicators) => ({
      ...prevIndicators,
      [eventName]: true,
    }));

    // Apaga o indicador após um curto período
    setTimeout(() => {
      setEventIndicators((prevIndicators) => ({
        ...prevIndicators,
        [eventName]: false,
      }));
    }, 500); // Duração do indicador aceso (ms)
  };

  // Handlers de eventos (Mouse/Touch)
  const handleTouchStart = (event) => {
    triggerEventIndicator('touchstart');
    setTouchCount(event.touches.length);
    updateActiveTouches(event.touches);

    if (isEventInsideButton(event)) {
      setButtonActive(true);
      setIsMoving(false);
    }
  };

  const handleTouchMove = (event) => {
    triggerEventIndicator('touchmove');
    setIsMoving(true);
    updateActiveTouches(event.touches);

    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => {
      setIsMoving(false);
    }, 100);
  };

  const handleTouchEnd = (event) => {
    triggerEventIndicator('touchend');
    setTouchCount(event.touches.length);
    updateActiveTouches(event.touches);

    if (event.touches.length === 0) {
      setButtonActive(false);
      setIsMoving(false);
      setActiveTouches([]);

      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
        moveTimeout.current = null;
      }
    }
  };

  const handleTouchCancel = (event) => {
    triggerEventIndicator('touchcancel');
    setButtonActive(false);
    setIsMoving(false);
    setTouchCount(event.touches.length);
    updateActiveTouches(event.touches);
  };

  const handleMouseDown = (event) => {
    triggerEventIndicator('mousedown');
    setTouchCount(1);
    updateActiveTouches([event]);

    if (isEventInsideButton(event)) {
      setButtonActive(true);
      setIsMoving(false);
    }
  };

  const handleMouseMove = (event) => {
    triggerEventIndicator('mousemove');
    if (event.buttons === 1) {
      setIsMoving(true);
      updateActiveTouches([event]);

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    }
  };

  const handleMouseUp = (event) => {
    triggerEventIndicator('mouseup');
    setButtonActive(false);
    setIsMoving(false);
    setTouchCount(0);
    setActiveTouches([]);

    if (moveTimeout.current) {
      clearTimeout(moveTimeout.current);
      moveTimeout.current = null;
    }
  };

  const handleContextMenu = (event) => {
    triggerEventIndicator('contextmenu');
    // event.preventDefault(); // Opcional: comentar se quiser ver o menu de contexto
  };

  // Handlers de eventos de ponteiro (Pointer Events)
  const handlePointerDown = (event) => {
    triggerEventIndicator('pointerdown');
    setTouchCount(1);
    updateActiveTouches([event]);

    if (isEventInsideButton(event)) {
      setButtonActive(true);
      setIsMoving(false);
    }
  };

  const handlePointerMove = (event) => {
    triggerEventIndicator('pointermove');
    if (event.pressure > 0 || event.buttons === 1) { // Verifica se o ponteiro está pressionado
      setIsMoving(true);
      updateActiveTouches([event]);

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    }
  };

  const handlePointerUp = (event) => {
    triggerEventIndicator('pointerup');
    setButtonActive(false);
    setIsMoving(false);
    setTouchCount(0);
    setActiveTouches([]);

    if (moveTimeout.current) {
      clearTimeout(moveTimeout.current);
      moveTimeout.current = null;
    }
  };

  const handlePointerCancel = (event) => {
    triggerEventIndicator('pointercancel');
    setButtonActive(false);
    setIsMoving(false);
    setTouchCount(0);
    setActiveTouches([]);
  };

  const handlePointerOver = (event) => {
    triggerEventIndicator('pointerover');
  };

  const handlePointerOut = (event) => {
    triggerEventIndicator('pointerout');
  };

  const handlePointerEnter = (event) => {
    triggerEventIndicator('pointerenter');
  };

  const handlePointerLeave = (event) => {
    triggerEventIndicator('pointerleave');
  };

  // Renderização
  return (
    <div
      className="App"
      {...(usePointerEvents
        ? {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerCancel,
            onPointerOver: handlePointerOver,
            onPointerOut: handlePointerOut,
            onPointerEnter: handlePointerEnter,
            onPointerLeave: handlePointerLeave,
            onContextMenu: handleContextMenu,
          }
        : {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchCancel,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onContextMenu: handleContextMenu,
          })}
    >
      {/* Botão para alternar entre eventos */}
      <button
        className="toggle-button"
        onClick={() => setUsePointerEvents(!usePointerEvents)}
      >
        Usando {usePointerEvents ? 'Pointer Events' : 'Mouse/Touch Events'}
      </button>

      {/* Lista de indicadores de eventos */}
      <div className="event-indicators">
        {usePointerEvents ? (
          <>
            {['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'contextmenu'].map(
              (eventName) => (
                <div
                  key={eventName}
                  className={`event-indicator ${
                    eventIndicators[eventName] ? 'active' : ''
                  }`}
                >
                  {eventName}
                </div>
              )
            )}
          </>
        ) : (
          <>
            {['touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mousemove', 'mouseup', 'contextmenu'].map(
              (eventName) => (
                <div
                  key={eventName}
                  className={`event-indicator ${
                    eventIndicators[eventName] ? 'active' : ''
                  }`}
                >
                  {eventName}
                </div>
              )
            )}
          </>
        )}
      </div>

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
