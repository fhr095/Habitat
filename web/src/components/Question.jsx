import React, { useEffect, useState } from 'react';
import { AiOutlineRobot } from "react-icons/ai";
import { ClipLoader } from 'react-spinners';
import '../styles/Question.scss';

export default function Question({ question }) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (question) {
      setNotificationMessage(`Carregando resposta para: "${question}"`);
      setShowNotification(true);

      const timeoutId = setTimeout(() => {
        setShowNotification(false);
      }, 5000); // Oculta a notificação após 5 segundos

      return () => {
        clearTimeout(timeoutId);
        setShowNotification(false);
      };
    }
  }, [question]);

  return (
    <div>
      {showNotification && (
        <div className="notification-wrapper">
          <AiOutlineRobot size={50} className="robot-icon" />
          <div className="notification-container">
            <div className="notification-message">{notificationMessage}</div>
            <div className="loading-icon">
              <ClipLoader color={"#ffffff"} size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
