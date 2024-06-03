// components/MessageItem.jsx
import React from 'react';
import { MessageBox } from 'react-chat-elements';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';
import '../styles/Chat.scss';

export default function MessageItem({ id, message, formatTimestamp }) {
  return (
    <>
      <div id={id} className="message-item user-message">
        <MessageBox
          position="right"
          type="text"
          text={message.highlightedQuestion}
          dateString={formatTimestamp(message.timestamp)}
          statusIcon={<span className="message-tick">✔✔</span>}
        />
        <div className="message-meta">
          <span className="message-rating">
            {message.ratings === 'Gostei' ? <AiFillLike /> : <AiFillDislike />}
          </span>
        </div>
      </div>
      {message.highlightedResponses.map((response, idx) => (
        <div key={idx} className="message-item ia-message">
          <MessageBox
            position="left"
            type="text"
            text={response}
            dateString={formatTimestamp(message.timestamp)}
          />
        </div>
      ))}
    </>
  );
}
