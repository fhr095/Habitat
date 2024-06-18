import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { FaTimes } from 'react-icons/fa';
import { ref, deleteObject } from 'firebase/storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { Carousel } from 'react-bootstrap';
import { storage, db } from '../firebase';
import '../styles/MovableWidget.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function MovableWidget({ id, content, imageUrls, onDelete, onHide, isAdmin, initialPosition }) {
  const minWidth = 200;
  const minHeight = 100;

  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [size, setSize] = useState({ width: minWidth, height: minHeight });
  const [dragging, setDragging] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    console.log(imageUrls);
  }, [imageUrls]);

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
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          const fileRef = ref(storage, imageUrl);
          try {
            await deleteObject(fileRef);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
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
      onHide(id);
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
      minWidth={minWidth}
      minHeight={minHeight}
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
        {imageUrls && imageUrls.length > 0 ? (
          <Carousel>
            {imageUrls.map((imageUrl, index) => (
              <Carousel.Item key={index}>
                <img src={imageUrl} alt={`Widget Image ${index}`} className="widget-image" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <p>No images to display</p>
        )}
        <div>{content}</div>
      </div>
    </Rnd>
  );
}