// src/components/ControlPanel.jsx

import React, { useState, useRef, useEffect } from "react";
import { Slider, Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import "../styles/ControlPanel.scss";

const ControlPanel = ({
  onCameraChange,
  onLightChange,
  onRotateSpeedChange,
  onScreenPositionChange,
}) => {
  const [collapsed, setCollapsed] = useState(true); // Inicia na posição recolhida
  const [cameraFov, setCameraFov] = useState(75);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [rotateSpeed, setRotateSpeed] = useState(2.5);
  const [dragging, setDragging] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [toggleOpacity, setToggleOpacity] = useState(0); // Controle da opacidade do botão de alternância
  const timeoutRef = useRef(null);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleCameraFovChange = (value) => {
    setCameraFov(value);
    onCameraChange(value);
  };

  const handleLightIntensityChange = (value) => {
    setLightIntensity(value);
    onLightChange(value);
  };

  const handleRotateSpeedChange = (value) => {
    setRotateSpeed(value);
    onRotateSpeedChange(value);
  };

  const handleDragStart = () => {
    setDragging(true);
    setOpacity(0.2);  // Define o valor de opacidade desejado durante o arraste
  };

  const handleDragEnd = () => {
    setDragging(false);
    setOpacity(0.8);  // Restaura a opacidade quando o arraste termina
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setToggleOpacity(1);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setToggleOpacity(0);
    }, 2000); // Esmaecer após 2 segundos
  };

  useEffect(() => {
    const outerContainer = document.querySelector('.outer-container');
    outerContainer.addEventListener('mouseenter', handleMouseEnter);
    outerContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      outerContainer.removeEventListener('mouseenter', handleMouseEnter);
      outerContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className={`outer-container ${collapsed ? "collapsed" : ""}`}>
      <div className={`control-panel ${collapsed ? "collapsed" : ""} ${dragging ? "dragging" : ""}`} style={{ opacity }}>
        {!collapsed && (
          <div className="controls">
            <div className="control-item">
              <label>Camera FOV:</label>
              <Slider
                min={30}
                max={120}
                value={cameraFov}
                onChange={handleCameraFovChange}
                onAfterChange={handleDragEnd}
                onBeforeChange={handleDragStart}
              />
            </div>
            <div className="control-item">
              <label>Light Intensity:</label>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={lightIntensity}
                onChange={handleLightIntensityChange}
                onAfterChange={handleDragEnd}
                onBeforeChange={handleDragStart}
              />
            </div>
            <div className="control-item">
              <label>Rotation Speed:</label>
              <Slider
                min={0}
                max={10}
                step={0.1}
                value={rotateSpeed}
                onChange={handleRotateSpeedChange}
                onAfterChange={handleDragEnd}
                onBeforeChange={handleDragStart}
              />
            </div>
            <div className="control-item">
              <label>Screen Position:</label>
              <Button onClick={() => onScreenPositionChange("top-left")}>
                Top Left
              </Button>
              <Button onClick={() => onScreenPositionChange("top-right")}>
                Top Right
              </Button>
              <Button onClick={() => onScreenPositionChange("bottom-left")}>
                Bottom Left
              </Button>
              <Button onClick={() => onScreenPositionChange("bottom-right")}>
                Bottom Right
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="toggle-button" style={{ opacity: toggleOpacity }} onClick={handleToggle}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>
    </div>
  );
};

export default ControlPanel;
