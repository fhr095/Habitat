// Access.jsx
import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayRemove, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import Rating from "../Rating/Rating";
import CallAction from "../CallAction/CallAction";
import Equipe from "../Equipe/Equipe";
import ConfigWelcome from "../ConfigWelcome/ConfigWelcome";
import ContextMenu from "./ContextMenu";
import "./Access.scss";

// Objeto de configuração para mapeamento de componentes
const componentConfig = {
  equipe: { label: "Equipe", component: Equipe, adminOnly: false },
  callAction: { label: "Ação de Chamada", component: CallAction, adminOnly: false },
  configWelcome: { label: "Configurar Boas-vindas", component: ConfigWelcome, adminOnly: true },
  // Adicione mais componentes aqui conforme necessário
};

export default function Access({ habitat, userEmail, setChatMember, setChatGroup, setChatBot}) {
  const navigate = useNavigate();
  const [modals, setModals] = useState({
    edit: false,
    rating: false,
  });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("equipe");
  const [isAdmin, setIsAdmin] = useState(false);
  /*const [chatMember, setChatMember] = useState({});
  const [chatGroup, setChatGroup] = useState({});
  const [chatBot, setChatBot] = useState({});*/

  useEffect(() => {
    const checkAdmin = async () => {
      const habitatDoc = await getDoc(doc(db, "habitats", habitat.id));
      if (habitatDoc.exists()) {
        const habitatData = habitatDoc.data();
        setIsAdmin(habitatData.createdBy === userEmail);
      }
    };

    checkAdmin();
  }, [habitat.id, userEmail]);

  const toggleModal = (modalName, value) => {
    setModals((prevModals) => ({
      ...prevModals,
      [modalName]: value,
    }));
  };

  const toggleContextMenu = () => {
    setIsContextMenuOpen((prevState) => !prevState);
  };

  const handleShowComponent = (componentKey) => {
    setActiveComponent(componentKey);
    setIsContextMenuOpen(false);
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
        members: arrayRemove(userEmail),
      });

      alert("Você saiu do habitat.");
      setIsContextMenuOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair do habitat: ", error);
    }
  };

  const handleViewScene = () => {
    navigate(`/scene/${habitat.id}`);
  };

  /*const handleSetChatMember = (member) => {
    setChatMember(member);
    setChatGroup({});
    setChatBot({});
  };

  const handleSetChatGroup = (group) => {
    setChatGroup(group);
    setChatMember({});
    setChatBot({});
  };

  const handleSetChatBot = (bot) => {
    setChatBot(bot);
    setChatMember({});
    setChatGroup({});
  };
*/
  const ComponentToRender = componentConfig[activeComponent].component;

  return (
    <div className="access-container">
      <header>
        <div className="text">{habitat.name}</div>
        <ContextMenu
          isContextMenuOpen={isContextMenuOpen}
          toggleContextMenu={toggleContextMenu}
          handleShowComponent={handleShowComponent}
          handleViewScene={handleViewScene}
          handleDeleteHabitat={handleDeleteHabitat}
          handleLeaveHabitat={handleLeaveHabitat}
          habitat={habitat}
          userEmail={userEmail}
          componentConfig={componentConfig}
          isAdmin={isAdmin}
        />
      </header>
      <div className="divider" />

      {ComponentToRender && (
        <ComponentToRender
          habitat={habitat}
          userEmail={userEmail}
          /*setChatMember={handleSetChatMember}
          setChatGroup={handleSetChatGroup}
          setChatBot={handleSetChatBot}*/
          setChatMember={setChatMember}
          setChatGroup={setChatGroup}
          setChatBot={setChatBot}
        />
      )}

      {modals.edit && <ModalEditHabitat habitatId={habitat.id} onClose={() => toggleModal("edit", false)} />}
      {modals.rating && <Rating habitatId={habitat.id} onClose={() => toggleModal("rating", false)} />}
    </div>
  );
}
