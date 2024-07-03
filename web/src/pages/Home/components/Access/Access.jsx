import React, { useState } from "react";
import { FaAngleDown, FaPlus } from "react-icons/fa";
import ModalAddMembers  from "../ModalAddMembers/ModalAddMembers";
import "./Access.scss";

export default function Access({ habitat }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="access-container">
      <header>
        <p>{habitat.name}</p>
        <button>
          <FaAngleDown size={20} />
        </button>
      </header>
      <div className="divider" />

      <div className="topics">
        <p>Membros</p>
        <button onClick={openModal}>
          <FaPlus size={15} />
        </button>
      </div>

      {isModalOpen && <ModalAddMembers onClose={closeModal} habitatId={habitat.id} />}
    </div>
  );
}