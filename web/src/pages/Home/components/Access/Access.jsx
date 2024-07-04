import React, { useState, useEffect } from "react";
import { FaAngleDown, FaPlus } from "react-icons/fa";
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import "./Access.scss";

export default function Access({ habitat, userEmail }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
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

  const toggleContextMenu = () => {
    setIsContextMenuOpen(prevState => !prevState);
  };

  const handleDeleteHabitat = async () => {
    try {
      // Deletar o modelo GLB do Storage
      const glbFileRef = ref(storage, habitat.glbFileUrl);
      await deleteObject(glbFileRef);

      // Deletar o documento do habitat do Firestore
      const habitatRef = doc(db, "habitats", habitat.id);
      await deleteDoc(habitatRef);

      alert("Habitat deletado com sucesso.");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao deletar habitat: ", error);
    }
  };

  const handleLeaveHabitat = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      await updateDoc(habitatRef, {
        members: arrayRemove(userEmail)
      });

      alert("Você saiu do habitat.");
      setIsContextMenuOpen(false);
    } catch (error) {
      console.error("Erro ao sair do habitat: ", error);
    }
  };

  return (
    <div className="access-container">
      <header>
        <p>{habitat.name}</p>
        <button onClick={toggleContextMenu}>
          <FaAngleDown size={20} />
        </button>
        {isContextMenuOpen && (
          <div className="context-menu">
            {habitat.createdBy === userEmail ? (
              <button onClick={handleDeleteHabitat}>Deletar Habitat</button>
            ) : (
              <button onClick={handleLeaveHabitat}>Sair do Habitat</button>
            )}
          </div>
        )}
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