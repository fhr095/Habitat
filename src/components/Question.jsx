import React, { useEffect, useState } from 'react';
import '../styles/Question.scss';

export default function Question({ question, showNotification }) {
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (question) {
      setNotificationMessage(question);
    }
  }, [question]);

  return (
    <div>
      {showNotification && (
        <div className="notification-wrapper">
          <div className="notification-container">
            <div className="notification-message">{notificationMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
