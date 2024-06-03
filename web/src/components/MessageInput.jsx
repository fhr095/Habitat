import React, { useState } from 'react';
import { FaPaperPlane, FaMicrophone } from 'react-icons/fa';
import '../styles/Chat.scss';

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <input
        type="text"
        className="message-input"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="send-button" onClick={handleSend}>
        {message.trim() ? <FaPaperPlane size={20} /> : <FaMicrophone size={20} />}
      </button>
    </div>
  );
};

export default MessageInput;
