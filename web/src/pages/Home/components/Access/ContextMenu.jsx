// ContextMenu.jsx
import React from 'react';
import { FaAngleDown } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function ContextMenu({ 
  isContextMenuOpen, 
  toggleContextMenu, 
  handleShowComponent, 
  habitat, 
  userEmail, 
  componentConfig, 
  isAdmin 
}) {
  const navigate = useNavigate();

  const handleViewScene = () => {
    navigate(`/scene/${habitat.id}`);
  };

  const handleDeleteHabitat = async () => {
    try {
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
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair do habitat: ", error);
    }
  };

  return (
    <div className="context-menu">
      <button onClick={toggleContextMenu} className="context-menu-toggle">
        <FaAngleDown size={20} />
      </button>
      {isContextMenuOpen && (
        <div className="context-menu-items">
          {Object.keys(componentConfig).map(key => (
            (!componentConfig[key].adminOnly || isAdmin) && (
              <button key={key} onClick={() => handleShowComponent(key)}>
                {componentConfig[key].label}
              </button>
            )
          ))}
          <button onClick={handleViewScene}>Visualizar</button>
          {isAdmin && <button onClick={handleDeleteHabitat}>Deletar Habitat</button>}
          <button onClick={handleLeaveHabitat}>Sair do Habitat</button>
        </div>
      )}
    </div>
  );
}
