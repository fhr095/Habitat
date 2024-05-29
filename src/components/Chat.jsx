import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import '../styles/Chat.scss';
import { FiMoreVertical } from 'react-icons/fi';
import { AiOutlineUp, AiOutlineDown, AiFillLike, AiFillDislike } from 'react-icons/ai';
import { FiExternalLink } from 'react-icons/fi'; // Importing external link icon

export default function Chat({ isOpen, onSearch, feedbackFilter, setFeedbackFilter, dateRangeFilter, setDateRangeFilter }) {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [highlightedMessages, setHighlightedMessages] = useState([]);
  const chatInnerRef = useRef(null); // Adiciona a referência

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

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  useEffect(() => {
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

    const newFilteredMessages = messages.filter((message) => {
      const matchesFeedback = feedbackFilter === '' || message.ratings === feedbackFilter;
      const matchesDate = filterByDateRange(message.timestamp);

      return (matchesSearchTerm(message.question) || message.responses.some(matchesSearchTerm)) && matchesFeedback && matchesDate;
    });

    setFilteredMessages(newFilteredMessages);
    setHighlightedMessages(newFilteredMessages.map(highlightMessage));
    setHighlightIndex(-1);
  }, [searchTerm, feedbackFilter, dateRangeFilter, messages]);

  useEffect(() => {
    // Rola para o fim ao abrir o chat ou quando as mensagens são atualizadas
    if (chatInnerRef.current) {
      chatInnerRef.current.scrollTop = chatInnerRef.current.scrollHeight;
    }
  }, [isOpen, filteredMessages]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleFeedbackFilterChange = (value) => {
    setFeedbackFilter(value);
  };

  const handleDateRangeChange = (e) => {
    setDateRangeFilter(e.target.value === 'custom' ? { type: 'custom', custom: ['', ''] } : { type: e.target.value });
  };

  const filterByDateRange = (timestamp) => {
    if (!timestamp) return true; // Se timestamp for nulo, retornar true
    const now = new Date();
    const date = timestamp ? timestamp.toDate() : null;

    if (!date) return false; // Se date for nulo, retornar false

    switch (dateRangeFilter.type) {
      case 'lastDay':
        return date >= new Date(now.setDate(now.getDate() - 1));
      case 'lastWeek':
        return date >= new Date(now.setDate(now.getDate() - 7));
      case 'last3Months':
        return date >= new Date(now.setMonth(now.getMonth() - 3));
      case 'thisYear':
        return date.getFullYear() === new Date().getFullYear();
      case 'custom':
        const [startDate, endDate] = dateRangeFilter.custom || [];
        return startDate && endDate ? (date >= new Date(startDate) && date <= new Date(endDate)) : true;
      default:
        return true;
    }
  };

  const navigateHighlights = (direction) => {
    const newIndex = highlightIndex + direction;
    if (newIndex >= 0 && newIndex < highlightedMessages.length) {
      setHighlightIndex(newIndex);
      const messageElement = document.getElementById(highlightedMessages[newIndex].id);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp ? timestamp.toDate() : new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateHeader = (timestamp) => {
    const date = timestamp ? timestamp.toDate() : new Date();
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

  const groupedMessages = groupMessagesByDate(highlightedMessages);

  return (
    <div className={`chat-container ${isOpen ? 'show' : 'hide'}`}>
      <div className="chat-header">
        <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
          <FiMoreVertical size={20} />
        </button>
        <a className="training-button" href="https://roko.flowfuse.cloud/trainData?utm_source=centroadm" target="_blank">
          <FiExternalLink size={20} />
        </a>
      </div>
      {showFilters && (
        <div className="filters">
          <div className="like-dislike-counter">
            <button
              className={`counter-item ${feedbackFilter === 'Gostei' ? 'active' : ''}`}
              onClick={() => handleFeedbackFilterChange(feedbackFilter === 'Gostei' ? '' : 'Gostei')}
            >
              <AiFillLike size={20} />
              <span>{messages.filter(msg => msg.ratings === 'Gostei').length}</span>
            </button>
            <button
              className={`counter-item ${feedbackFilter === 'Não gostei' ? 'active' : ''}`}
              onClick={() => handleFeedbackFilterChange(feedbackFilter === 'Não gostei' ? '' : 'Não gostei')}
            >
              <AiFillDislike size={20} />
              <span>{messages.filter(msg => msg.ratings === 'Não gostei').length}</span>
            </button>
          </div>
          <div className="search-bar-container">
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search messages..." 
              value={searchTerm} 
              onChange={handleSearch} 
            />
            <div className="navigation-buttons">
              <button onClick={() => navigateHighlights(-1)} disabled={highlightedMessages.length === 0}>
                <AiOutlineUp size={20} />
              </button>
              <button onClick={() => navigateHighlights(1)} disabled={highlightedMessages.length === 0}>
                <AiOutlineDown size={20} />
              </button>
            </div>
          </div>
          <div className="date-range-filter">
            <select onChange={handleDateRangeChange} value={dateRangeFilter.type}>
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
                  onChange={(e) => setDateRangeFilter((prev) => ({ ...prev, custom: [e.target.value, prev.custom?.[1]] }))} 
                  value={dateRangeFilter.custom?.[0] || ''} 
                />
                <input 
                  type="date" 
                  onChange={(e) => setDateRangeFilter((prev) => ({ ...prev, custom: [prev.custom?.[0], e.target.value] }))} 
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
              <div key={message.id} id={message.id} className={`message-item ${index === highlightIndex ? 'highlighted' : ''}`}>
                <div className="message-content user-message">
                  <p>{message.highlightedQuestion}</p>
                  <div className="message-meta">
                    <span className="message-rating">{message.ratings === 'Gostei' ? <AiFillLike /> : <AiFillDislike />}</span>
                    <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                    <span className="message-tick">✔✔</span>
                  </div>
                </div>
                {message.responses.map((response, idx) => (
                  <div key={idx} className="ia-message-wrapper">
                    {idx === 0 && (
                      <div className="ia-header">
                        <img src="path-to-avatar" alt="IA Avatar" className="ia-avatar" />
                        <strong>IA</strong>
                      </div>
                    )}
                    <div className="message-content ia-message">
                      <p>{response}</p>
                      <div className="message-meta">
                        <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
