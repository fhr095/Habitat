// Topics.js
import React from "react";
import { FaPlus, FaEllipsisV } from "react-icons/fa";

export default function Topics({ title, items, onAdd, onItemClick, onEditClick, userEmail, createdBy }) {
  return (
    <div className="topics">
      <header>
        <div className="text">{title}</div>
        {createdBy === userEmail && (
          <button onClick={onAdd}>
            <FaPlus size={15} />
          </button>
        )}
      </header>
      <div className="items-list">
        {items.length > 0 ? (
          items.map(item => (
            <div className="item-container" key={item.id}>
              <div className="item" onClick={() => onItemClick(item)}>
                <img src={item.imageUrl || item.profileImageUrl || item.imgUrl} alt={item.name} />
                <div className="text">{item.name}</div>
                {item.tag && <span style={{ color: item.color }}>{item.tag}</span>}
              </div>
              {createdBy === userEmail && (
                <button className="edit-button" onClick={() => onEditClick(item)}>
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}