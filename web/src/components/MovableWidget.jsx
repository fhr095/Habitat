import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { FaTimes } from 'react-icons/fa';
import { ref, deleteObject } from 'firebase/storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';
import '../styles/MovableWidget.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function MovableWidget({ id, content, imageUrl, onDelete, isAdmin }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 300, height: 200 });
  const [dragging, setDragging] = useState(false);
  const [hidden, setHidden] = useState(false);

  const snapToGrid = (x, y) => {
    const margin = 20;
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

  const handleDelete = async () => {
    if (isAdmin) {
      if (imageUrl) {
        const fileRef = ref(storage, imageUrl);
        try {
          await deleteObject(fileRef);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }
      try {
        await deleteDoc(doc(db, 'widgets', id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
      onDelete(id);
    } else {
      setHidden(true);
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <Rnd
      position={position}
      size={size}
      bounds="window"
      minWidth={200}
      minHeight={100}
      maxWidth={window.innerWidth - 40}
      maxHeight={window.innerHeight - 40}
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
        onClick={handleDelete}
        className="btn btn-link p-0 delete-button"
      >
        <FaTimes />
      </button>
      <div className="content">
        {imageUrl && <img src={imageUrl} alt="Widget Image" className="img-fluid" />}
        <div>{content}</div>
      </div>
    </Rnd>
  );
}