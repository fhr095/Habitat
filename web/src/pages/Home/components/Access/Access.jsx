import React, { useState, useEffect } from "react";
import { FaAngleDown, FaPlus } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import "./Access.scss";

export default function Access({ habitat }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = [];
        const memberEmails = habitat.members || []; // Use empty array if members does not exist
        for (const email of memberEmails) {
          const q = query(collection(db, "users"), where("email", "==", email));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            membersData.push({ id: doc.id, ...doc.data() });
          });
        }
        setMembers(membersData);
      } catch (error) {
        console.error("Erro ao buscar membros: ", error);
      }
    };

    fetchMembers();
  }, [habitat.members]);

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
        <header>
          <p>Membros</p>
          <button onClick={openModal}>
            <FaPlus size={15} />
          </button>
        </header>
        <div className="members-list">
          {members.length > 0 ? (
            members.map(member => (
              <div key={member.id} className="member-item">
                <img src={member.profileImageUrl} alt={member.name} />
                <p>{member.name}</p>
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      </div>

      <div className="divider" />
      <div className="topics">
        <header>
          <p>Bots e Assistentes</p>
          <button onClick={openModal}>
            <FaPlus size={15} />
          </button>
        </header>
      </div>

      <div className="divider" />
      <div className="topics">
        <header>
          <p>Grupos</p>
          <button onClick={openModal}>
            <FaPlus size={15} />
          </button>
        </header>
      </div>

      <div className="divider" />
      <div className="topics">
        <header>
          <p>Salas</p>
          <button onClick={openModal}>
            <FaPlus size={15} />
          </button>
        </header>
      </div>

      {isModalOpen && <ModalAddMembers onClose={closeModal} habitatId={habitat.id} />}
    </div>
  );
}