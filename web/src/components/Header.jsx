import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';

const Header = ({ onFilterClick }) => (
  <div className="chat-header">
    <button className="filter-button" onClick={onFilterClick}>
      <FiMoreVertical size={20} />
    </button>
  </div>
);

export default Header;
