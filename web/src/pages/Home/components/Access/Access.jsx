import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayRemove, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import ModalAddBots from "../ModalAddBots/ModalAddBots";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalEditGroup from "../ModalEditGroup/ModalEditGroup";
import ModalEditBot from "../ModalEditBot/ModalEditBot";
import Rating from "../Rating/Rating";
import Equipe from "../Equipe/Equipe";
import ConfigWelcome from "../ConfigWelcome/ConfigWelcome";
import ContextMenu from "./ContextMenu";
import "./Access.scss";

// Objeto de configuração para mapeamento de componentes
const componentConfig = {
  equipe: { label: "Equipe", component: Equipe, adminOnly: false },
  configWelcome: { label: "Configurar Boas-vindas", component: ConfigWelcome, adminOnly: false },
  // Adicione mais componentes aqui conforme necessário
};

export default function Access({ habitat, userEmail, setChatMember, setChatGroup, setChatBot, setSelectedMember, setSelectedGroup, setSelectedBot }) {
  const navigate = useNavigate();
  const [modals, setModals] = useState({
    members: false,
    groups: false,
    bots: false,
    edit: false,
    editMember: false,
    editGroup: false,
    editBot: false,
    rating: false,
  });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("equipe"); // Novo estado
  const [isAdmin, setIsAdmin] = useState(false);

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
    setModals(prevModals => ({
      ...prevModals,
      [modalName]: value,
    }));
  };

  const toggleContextMenu = () => {
    setIsContextMenuOpen(prevState => !prevState);
  };

  const handleShowComponent = (componentKey) => {
    setActiveComponent(componentKey);
    setIsContextMenuOpen(false);
  };

  const handleDeleteHabitat = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      // Implement delete logic here
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
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair do habitat: ", error);
    }
  };

  const handleViewScene = () => {
    navigate(`/scene/${habitat.id}`);
  };

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
          setChatMember={setChatMember}
          setChatGroup={setChatGroup}
          setChatBot={setChatBot}
          toggleModal={toggleModal}
          setSelectedMember={setSelectedMember}
          setSelectedGroup={setSelectedGroup}
          setSelectedBot={setSelectedBot}
          isAdmin={isAdmin}
        />
      )}

      {modals.members && <ModalAddMembers onClose={() => toggleModal("members", false)} habitatId={habitat.id} />}
      {modals.groups && <ModalAddGroups onClose={() => toggleModal("groups", false)} habitatId={habitat.id} userEmail={userEmail} />}
      {modals.bots && <ModalAddBots onClose={() => toggleModal("bots", false)} habitatId={habitat.id} />}
      {modals.edit && <ModalEditHabitat habitatId={habitat.id} onClose={() => toggleModal("edit", false)} />}
      {modals.editMember && <ModalEditMember habitatId={habitat.id} selectedMember={setSelectedMember} onClose={() => toggleModal("editMember", false)} />}
      {modals.editGroup && <ModalEditGroup habitatId={habitat.id} selectedGroup={setSelectedGroup} onClose={() => toggleModal("editGroup", false)} />}
      {modals.editBot && <ModalEditBot selectedBot={setSelectedBot} ifcFileUrl={habitat.ifcFileUrl} onClose={() => toggleModal("editBot", false)} />}
      {modals.rating && <Rating habitatId={habitat.id} onClose={() => toggleModal("rating", false)} />}
    </div>
  );
}