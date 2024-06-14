import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { FaTimes } from 'react-icons/fa';

export default function MovableWidget({ id, content, onDelete }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const snapToGrid = (x, y) => {
    const margin = 20; // Ajuste conforme necessário
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x < margin) x = 0;
    else if (x > windowWidth - 200 - margin) x = windowWidth - 200; // 200 é a largura do widget

    if (y < margin) y = 0;
    else if (y > windowHeight - 100 - margin) y = windowHeight - 100; // 100 é a altura do widget

    return { x, y };
  };

  const handleDragStop = (e, d) => {
    const { x, y } = snapToGrid(d.x, d.y);
    setPosition({ x, y });
    setDragging(false);
  };

  return (
    <Rnd
      position={position}
      size={{ width: 200, height: 100 }}
      bounds="window"
      onDragStart={() => setDragging(true)}
      onDragStop={handleDragStop}
      onDrag={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      style={{
        border: '1px solid black',
        backgroundColor: 'white',
        padding: '10px',
        boxShadow: dragging ? '0 4px 10px rgba(0, 0, 0, 0.3)' : '0 2px 5px rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        position: 'absolute',
        transition: dragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <button
        onClick={() => onDelete(id)}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'red',
        }}
      >
        <FaTimes />
      </button>
      {content}
    </Rnd>
  );
}