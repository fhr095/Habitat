import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import Header from './Header';
import Filters from './Filters';
import MessageInput from './MessageInput';
import { GoDiscussionClosed } from 'react-icons/go';
import '../styles/Chat.scss';

export default function ChatContainer({ isOpen, setChatOpen, onSearch, feedbackFilter, setFeedbackFilter, dateRangeFilter, setDateRangeFilter }) {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const chatInnerRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedMessages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        updatedMessages.push({
          id: doc.id,
          question: data.question,
          responses: data.responses,
          ratings: data.ratings,
          timestamp: data.timestamp,
        });
      });
      setMessages(updatedMessages);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chatInnerRef.current) {
      chatInnerRef.current.scrollTop = chatInnerRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const matchesSearchTerm = (text) => text.toLowerCase().includes(searchTerm.toLowerCase());

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? <span key={index} className="highlight">{part}</span> : part
    );
  };

  const highlightMessage = (message) => {
    const highlightedQuestion = matchesSearchTerm(message.question) ? highlightText(message.question) : message.question;
    const highlightedResponses = message.responses.map((response) =>
      matchesSearchTerm(response) ? highlightText(response) : response
    );

    return {
      ...message,
      highlightedQuestion,
      highlightedResponses,
    };
  };

  const filteredMessages = messages.filter((message) => {
    const matchesFeedback = feedbackFilter === '' || message.ratings === feedbackFilter;
    const matchesDate = true; // Implement date filtering logic if needed

    return (matchesSearchTerm(message.question) || message.responses.some(matchesSearchTerm)) && matchesFeedback && matchesDate;
  });

  const highlightedMessagesList = filteredMessages.map(highlightMessage);

  const navigateHighlights = (direction) => {
    const newIndex = highlightIndex + direction;
    if (newIndex >= 0 && newIndex < highlightedMessagesList.length) {
      setHighlightIndex(newIndex);
      const messageElement = document.getElementById(highlightedMessagesList[newIndex].id);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const formatDateHeader = (timestamp) => {
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "HOJE";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "ONTEM";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};

    messages.forEach((message) => {
      const dateKey = formatDateHeader(message.timestamp);
      if (!groupedMessages[dateKey]) {
        groupedMessages[dateKey] = [];
      }
      groupedMessages[dateKey].push(message);
    });

    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(highlightedMessagesList);

  const handleSendMessage = (message) => {
    // Implement the logic to send the message
    console.log("Send message:", message);
  };

  // Resize functionality
  const startResizing = (event) => {
    window.addEventListener('mousemove', resizeChatContainer);
    window.addEventListener('mouseup', stopResizing);
  };

  const resizeChatContainer = (event) => {
    if (chatContainerRef.current) {
      const newWidth = window.innerWidth - event.clientX;
      if (newWidth > 200 && newWidth < 600) {
        chatContainerRef.current.style.width = `${newWidth}px`;
      }
    }
  };

  const stopResizing = () => {
    window.removeEventListener('mousemove', resizeChatContainer);
    window.removeEventListener('mouseup', stopResizing);
  };

  return (
    <div className={`container-chat-container ${isOpen ? 'show' : 'hide'}`}>
      <button
        className="chat-button"
        onClick={() => setChatOpen(!isOpen)}
      >
        <GoDiscussionClosed color="white" size={20} />
      </button>
      <div
        className="chat-container"
        ref={chatContainerRef}
      >
        <div className="resizer" onMouseDown={startResizing}></div>
        <Header onFilterClick={() => setShowFilters(!showFilters)} />
        {showFilters && (
          <Filters
            searchTerm={searchTerm}
            onSearch={handleSearch}
            feedbackFilter={feedbackFilter}
            setFeedbackFilter={setFeedbackFilter}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            highlightedMessages={highlightedMessagesList}
            navigateHighlights={navigateHighlights}
          />
        )}
        <div className="chat-inner" ref={chatInnerRef}>
          {Object.keys(groupedMessages).map((dateKey) => (
            <React.Fragment key={dateKey}>
              <div className="date-header">{dateKey}</div>
              {groupedMessages[dateKey].map((message, index) => (
                <React.Fragment key={message.id}>
                  <div className="message-wrapper user-message">
                    <MessageBox
                      position="right"
                      type="text"
                      text={message.highlightedQuestion}
                      date={new Date(message.timestamp.seconds * 1000)}
                      status="sent"
                      data={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==' }}
                      focus={index === highlightIndex}
                    />
                  </div>
                  {message.highlightedResponses.map((response, idx) => (
                    <div className="message-wrapper ia-message" key={idx}>
                      <MessageBox
                        position="left"
                        type="text"
                        text={response}
                        date={new Date(message.timestamp.seconds * 1000)}
                        focus={index === highlightIndex}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
