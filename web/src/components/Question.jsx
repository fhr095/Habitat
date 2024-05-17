import React, { useEffect, useState } from 'react';
import '../styles/Question.scss';

export default function Question({ question }) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (question) {
      setNotificationMessage(`Carregando resposta para: "${question}"`);
      setShowNotification(true);

      const timeoutId = setTimeout(() => {
        setNotificationMessage(`Resposta: ${question}`);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000); // Oculta a notificação após 5 segundos
      }, 5000); // Atualiza a mensagem após 5 segundos

      return () => {
        clearTimeout(timeoutId);
        setShowNotification(false);
      };
    }
  }, [question]);

  return (
    <div>
      {showNotification && (
        <div className="notification-container">
          <div className="notification-message">{notificationMessage}</div>
          <div className="notification-progress"></div>
        </div>
      )}
    </div>
  );
}
