import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { FaTimes } from 'react-icons/fa';
import '../styles/MovableWidget.scss';

export default function MovableWidget({ id, content, onDelete }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 200, height: 100 });
  const [dragging, setDragging] = useState(false);

  const snapToGrid = (x, y) => {
    const margin = 20; // Ajuste conforme necessário
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x < margin) x = 0;
    else if (x > windowWidth - size.width - margin) x = windowWidth - size.width;

    if (y < margin) y = 0;
    else if (y > windowHeight - size.height - margin) y = windowHeight - size.height;

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
      size={size}
      bounds="window"
      minWidth={200}
      minHeight={100}
      maxWidth={window.innerWidth - 40} // Ajuste conforme necessário
      maxHeight={window.innerHeight - 40} // Ajuste conforme necessário
      onDragStart={() => setDragging(true)}
      onDragStop={handleDragStop}
      onDrag={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      onResize={(e, direction, ref, delta, position) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setPosition(position);
      }}
      className={`movable-widget ${dragging ? 'dragging' : ''} background-gradient`}
    >
      <button
        onClick={() => onDelete(id)}
        className="delete-button"
      >
        <FaTimes />
      </button>
      <div className="content">
        {content}
      </div>
    </Rnd>
  );
}