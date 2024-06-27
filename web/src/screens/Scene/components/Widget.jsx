import React, { useEffect, useState } from "react";
import { Carousel } from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Widget.scss";

export default function Widget({ habitatId }) {
  const [widgets, setWidgets] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchWidgets = async () => {
      if (habitatId) {
        const widgetsCollectionRef = collection(db, "habitats", habitatId, "widgets");
        const widgetsSnapshot = await getDocs(widgetsCollectionRef);
        const widgetsList = widgetsSnapshot.docs.map((doc) => doc.data());
        setWidgets(widgetsList);
      }
    };

    fetchWidgets();
  }, [habitatId]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
  };

  return (
    <div className={`widget-container ${expanded ? "expanded" : "collapsed"}`}>
      {expanded ? (
        <div className="carousel-wrapper">
          <button className="toggle-button" onClick={handleToggle}>
            <FaEyeSlash />
          </button>
          <Carousel
            activeIndex={activeIndex}
            onSelect={handleSelect}
            controls={false}
            indicators={false}
            interval={3000}
          >
            {widgets.map((widget, index) => (
              <Carousel.Item key={index}>
                <div className="carousel-content">
                  <img
                    className="d-block w-100 carousel-image"
                    src={widget.imageUrl}
                    alt={`Widget ${index + 1}`}
                  />
                  <div className="carousel-text">
                    <p>{widget.text}</p>
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
          <div className="carousel-dots">
            {widgets.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => handleSelect(index)}
              ></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="toggle-bar" onClick={handleToggle}>
          Ver mais
          <FaEye size={20} />
        </div>
      )}
    </div>
  );
}