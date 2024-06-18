import React, { useState } from 'react';
import { Carousel } from 'react-bootstrap';
import { FaEye, FaCompress } from 'react-icons/fa';
import '../styles/WidgetCarousel.scss';

export default function WidgetCarousel({ widgets }) {
  const [expanded, setExpanded] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!widgets.length) return null;

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSelect = (selectedIndex) => {
    setCurrentIndex(selectedIndex);
  };

  return (
    <div className={`widget-carousel-container ${expanded ? 'expanded' : 'collapsed'}`}>
      <button className="expand-button" onClick={handleToggleExpand}>
        {expanded ? '' : 'Visualizar'} {expanded ? <FaCompress /> : <FaEye />} 
      </button>
      {expanded && (
        <>
          <Carousel activeIndex={currentIndex} onSelect={handleSelect} indicators={false} controls={false}>
            {widgets.map((widget) => (
              <Carousel.Item key={widget.id}>
                {widget.imageUrl && (
                  <div className="carousel-image-container">
                    <img src={widget.imageUrl} alt={`Widget ${widget.id}`} className="carousel-image" />
                  </div>
                )}
                <div className="carousel-content">
                  <p>{widget.content}</p>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
          <div className="carousel-nav">
            <div className="nav-dots">
              {widgets.map((widget, index) => (
                <div
                  key={index}
                  className={`nav-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}