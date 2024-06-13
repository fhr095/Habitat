import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import { GoDiscussionClosed } from 'react-icons/go';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';
import { FiMoreVertical } from 'react-icons/fi';
import { FaPaperPlane, FaMicrophone } from 'react-icons/fa';
import '../styles/Chat.scss';

export default function ChatContainer({
  isOpen,
  setChatOpen,
  onSearch,
  feedbackFilter,
  setFeedbackFilter,
  dateRangeFilter,
  setDateRangeFilter,
}) {
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

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
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

  const isWithinDateRange = (timestamp) => {
    if (!timestamp || !dateRangeFilter || !dateRangeFilter.type) return true;

    const date = timestamp.toDate();
    const now = new Date();

    switch (dateRangeFilter.type) {
      case 'lastDay':
        return date >= new Date(now.setDate(now.getDate() - 1));
      case 'lastWeek':
        return date >= new Date(now.setDate(now.getDate() - 7));
      case 'last3Months':
        return date >= new Date(now.setMonth(now.getMonth() - 3));
      case 'thisYear':
        return date.getFullYear() === now.getFullYear();
      case 'custom':
        const [startDate, endDate] = dateRangeFilter.custom || [];
        return (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate));
      default:
        return true;
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesFeedback = feedbackFilter === '' || message.ratings === feedbackFilter;
    const matchesDate = isWithinDateRange(message.timestamp);

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
    if (!timestamp || !timestamp.toDate) return ''; // Adiciona verificação para timestamp nulo ou indefinido
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
      <div className="chat-container" ref={chatContainerRef}>
        <div className="resizer" onMouseDown={startResizing}></div>
        <div className="chat-header">
          <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
            <FiMoreVertical size={20} />
          </button>
        </div>
        {showFilters && (
          <div className="filters">
            <div className="like-dislike-counter">
              <button
                className={`counter-item ${feedbackFilter === 'Like' ? 'active' : ''}`}
                onClick={() => setFeedbackFilter(feedbackFilter === 'Like' ? '' : 'Like')}
              >
                <AiFillLike size={20} className="like-icon" />
                <span>{useMemo(() => messages.filter((message) => message.ratings === 'Like').length, [messages])}</span>
              </button>
              <button
                className={`counter-item ${feedbackFilter === 'Dislike' ? 'active' : ''}`}
                onClick={() => setFeedbackFilter(feedbackFilter === 'Dislike' ? '' : 'Dislike')}
              >
                <AiFillDislike size={20} className="dislike-icon" />
                <span>{useMemo(() => messages.filter((message) => message.ratings === 'Dislike').length, [messages])}</span>
              </button>
            </div>
            <div className="search-bar-container">
              <input
                type="text"
                className="search-bar"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="date-range-filter">
              <select onChange={(e) => setDateRangeFilter({ type: e.target.value })} value={dateRangeFilter.type}>
                <option value="">Any time</option>
                <option value="lastDay">Last day</option>
                <option value="lastWeek">Last week</option>
                <option value="last3Months">Last 3 months</option>
                <option value="thisYear">This year</option>
                <option value="custom">Custom range</option>
              </select>
              {dateRangeFilter.type === 'custom' && (
                <div className="custom-date-range">
                  <input
                    type="date"
                    onChange={(e) =>
                      setDateRangeFilter((prev) => ({ ...prev, custom: [e.target.value, prev.custom?.[1]] }))
                    }
                    value={dateRangeFilter.custom?.[0] || ''}
                  />
                  <input
                    type="date"
                    onChange={(e) =>
                      setDateRangeFilter((prev) => ({ ...prev, custom: [prev.custom?.[0], e.target.value] }))
                    }
                    value={dateRangeFilter.custom?.[1] || ''}
                  />
                </div>
              )}
            </div>
          </div>
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
                      date={message.timestamp ? new Date(message.timestamp.seconds * 1000) : ''}
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
                        date={message.timestamp ? new Date(message.timestamp.seconds * 1000) : ''}
                        focus={index === highlightIndex}
                      />
                      <div className="message-meta">
                        {message.ratings === 'Like' ? <AiFillLike color="green" size={20} /> : <AiFillDislike color="red" size={20} />}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="message-input-container">
          <input
            type="text"
            className="message-input"
            placeholder="Type a message"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage(searchTerm);
            }}
          />
          <button className="send-button" onClick={() => handleSendMessage(searchTerm)}>
            {searchTerm.trim() ? <FaPaperPlane size={20} /> : <FaMicrophone size={20} />}
          </button>
        </div>
      </div>
      <button
        className="chat-button"
        onClick={() => setChatOpen(!isOpen)}
      >
        <GoDiscussionClosed color="white" size={20} />
      </button>
    </div>
  );
}