import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';

const Filters = ({
  searchTerm,
  onSearch,
  feedbackFilter,
  setFeedbackFilter,
  dateRangeFilter,
  setDateRangeFilter,
  highlightedMessages,
  navigateHighlights,
  messages,
}) => {
  const likeCount = useMemo(
    () => messages.filter((message) => message.ratings === 'Like').length,
    [messages]
  );
  const dislikeCount = useMemo(
    () => messages.filter((message) => message.ratings === 'Dislike').length,
    [messages]
  );

  return (
    <div className="filters">
      <div className="like-dislike-counter">
        <button
          className={`counter-item ${feedbackFilter === 'Like' ? 'active' : ''}`}
          onClick={() => setFeedbackFilter(feedbackFilter === 'Like' ? '' : 'Like')}
        >
          <AiFillLike size={20} color={feedbackFilter === 'Like' ? 'green' : 'inherit'} />
          <span>{likeCount}</span>
        </button>
        <button
          className={`counter-item ${feedbackFilter === 'Dislike' ? 'active' : ''}`}
          onClick={() => setFeedbackFilter(feedbackFilter === 'Dislike' ? '' : 'Dislike')}
        >
          <AiFillDislike size={20} color={feedbackFilter === 'Dislike' ? 'red' : 'inherit'} />
          <span>{dislikeCount}</span>
        </button>
      </div>
      <div className="search-bar-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
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
  );
};

Filters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  feedbackFilter: PropTypes.string.isRequired,
  setFeedbackFilter: PropTypes.func.isRequired,
  dateRangeFilter: PropTypes.object.isRequired,
  setDateRangeFilter: PropTypes.func.isRequired,
  highlightedMessages: PropTypes.array.isRequired,
  navigateHighlights: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired, // Adiciona propType para messages
};

export default Filters;