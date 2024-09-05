import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';

export default function Header ({ onFilterClick }) {
  return(
    <div className="chat-header">
    <button className="filter-button" onClick={onFilterClick}>
      <FiMoreVertical size={20} />
    </button>
  </div>
  )
}
