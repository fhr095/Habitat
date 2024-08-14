import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  arrayRemove,
  deleteDoc,
  onSnapshot,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
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
import Topics from "./Topics";
import ConfigWelcome from "../ConfigWelcome/ConfigWelcome";

import "./Access.scss";

export default function Access({
  habitat,
  userEmail,
  setChatMember,
  setChatGroup,
  setChatBot,
}) {
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
    configWelcome: false,
  });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bots, setBots] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBot, setSelectedBot] = useState("");

  useEffect(() => {
    const fetchMembers = () => {
      const q = query(collection(db, `habitats/${habitat.id}/members`));
      return onSnapshot(q, async (querySnapshot) => {
        const membersData = [];
        for (const memberDoc of querySnapshot.docs) {
          const memberData = memberDoc.data();
          const userQuery = query(
            collection(db, "users"),
            where("email", "==", memberData.email)
          );
          const userDocSnapshot = await getDocs(userQuery);
          if (!userDocSnapshot.empty) {
            const userData = userDocSnapshot.docs[0].data();
            membersData.push({
              id: memberDoc.id,
              ...memberData,
              profileImageUrl: userData.profileImageUrl,
              name: userData.name,
            });
          }
        }
        setMembers(membersData);
      });
    };

    const fetchGroups = () => {
      const q = query(
        collection(db, `habitats/${habitat.id}/groups`),
        where("users", "array-contains", userEmail)
      );
      return onSnapshot(q, (querySnapshot) => {
        const groupsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
      });
    };

    const fetchBots = () => {
      const q = query(collection(db, `habitats/${habitat.id}/avatars`));
      return onSnapshot(q, (querySnapshot) => {
        const botsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBots(botsData);
      });
    };

    const unsubscribeMembers = fetchMembers();
    const unsubscribeGroups = fetchGroups();
    const unsubscribeBots = fetchBots();

    return () => {
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeGroups) unsubscribeGroups();
      if (unsubscribeBots) unsubscribeBots();
    };
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

  const handleDeleteHabitat = async () => {
    const habitatId = habitat.id;
    try {
      if (typeof habitatId !== "string") {
        throw new Error(`Expected habitatId to be a string, but got ${typeof habitatId}`);
      }
  
      const habitatRef = doc(db, "habitats", habitatId);
  
      const deleteSubcollectionsRecursively = async (docRef) => {
        const subcollectionsSnapshot = await getDocs(collectionGroup(db, docRef.id));
  
        for (const subcollectionDoc of subcollectionsSnapshot.docs) {
          const subDocRef = subcollectionDoc.ref;
          await deleteSubcollectionsRecursively(subDocRef);
          await deleteDoc(subDocRef);
        }
      };
  
      await deleteSubcollectionsRecursively(habitatRef);
  
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

  const handleMemberClick = (member) => {
    if (member.email !== userEmail) {
      setChatMember(member);
    }
  };

  const handleGroupClick = (group) => {
    setChatGroup(group);
  };

  const handleBotClick = (bot) => {
    setChatBot(bot);
  };

  const handleViewScene = () => {
    navigate(`/scene/${habitat.id}`);
  };

  const toggleDataCollection = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      const newStatus = !habitat.dataCollectionEnabled;
      await updateDoc(habitatRef, { dataCollectionEnabled: newStatus });
      alert(
        newStatus
          ? "Coleta de dados ativada."
          : "Coleta de dados desativada."
      );
    } catch (error) {
      console.error("Erro ao alterar status da coleta de dados: ", error);
    }
  };

  return (
    <div className="access-container">
      <header>
        <div className="text">{habitat.name}</div>
        <div className="context-menu">
          <button onClick={toggleContextMenu} className="context-menu-toggle">
            <FaAngleDown size={20} />
          </button>
          {isContextMenuOpen && (
            <div className="context-menu-items">
              {habitat.createdBy === userEmail && (
                <>
                  <button onClick={handleViewScene}>Visualizar</button>
                  <button onClick={() => toggleModal("configWelcome", false)}>
                    Equipe
                  </button>
                  <button onClick={() => toggleModal("configWelcome", true)}>
                    Configurar Chamado
                  </button>
                  <button onClick={() => toggleModal("rating", true)}>
                    Avaliações
                  </button>
                  <button onClick={() => toggleModal("edit", true)}>
                    Editar Habitat
                  </button>
                  <button onClick={toggleDataCollection}>
                    {habitat.dataCollectionEnabled
                      ? "Desativar Coleta de Dados"
                      : "Ativar Coleta de Dados"}
                  </button>
                  <button onClick={handleDeleteHabitat}>Deletar Habitat</button>
                </>
              )}
              {habitat.createdBy !== userEmail && (
                <>
                  <button onClick={handleViewScene}>Visualizar</button>
                  <button onClick={handleLeaveHabitat}>Sair do Habitat</button>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="divider" />

      <Topics
        title="Membros"
        items={members}
        onAdd={() => toggleModal("members", true)}
        onItemClick={handleMemberClick}
        onEditClick={(user) => {
          setSelectedMember(user.id);
          toggleModal("editMember", true);
        }}
        userEmail={userEmail}
        createdBy={habitat.createdBy}
      />

      <div className="divider" />

      <Topics
        title="Grupos"
        items={groups}
        onAdd={() => toggleModal("groups", true)}
        onItemClick={handleGroupClick}
        onEditClick={(group) => {
          setSelectedGroup(group.id);
          toggleModal("editGroup", true);
        }}
        userEmail={userEmail}
        createdBy={habitat.createdBy}
      />

      <div className="divider" />

      <Topics
        title="Bots e Assistentes"
        items={bots}
        onAdd={() => toggleModal("bots", true)}
        onItemClick={handleBotClick}
        onEditClick={(bot) => {
          setSelectedBot(bot.avt);
          toggleModal("editBot", true);
        }}
        userEmail={userEmail}
        createdBy={habitat.createdBy}
      />

      {modals.members && (
        <ModalAddMembers
          onClose={() => toggleModal("members", false)}
          habitatId={habitat.id}
        />
      )}
      {modals.groups && (
        <ModalAddGroups
          onClose={() => toggleModal("groups", false)}
          habitatId={habitat.id}
          userEmail={userEmail}
        />
      )}
      {modals.bots && (
        <ModalAddBots
          onClose={() => toggleModal("bots", false)}
          habitatId={habitat.id}
        />
      )}
      {modals.edit && (
        <ModalEditHabitat
          habitatId={habitat.id}
          onClose={() => toggleModal("edit", false)}
        />
      )}
      {modals.editMember && (
        <ModalEditMember
          habitatId={habitat.id}
          selectedMember={selectedMember}
          onClose={() => toggleModal("editMember", false)}
        />
      )}
      {modals.editGroup && (
        <ModalEditGroup
          habitatId={habitat.id}
          selectedGroup={selectedGroup}
          onClose={() => toggleModal("editGroup", false)}
        />
      )}
      {modals.editBot && (
        <ModalEditBot
          selectedBot={selectedBot}
          ifcFileUrl={habitat.ifcFileUrl}
          onClose={() => toggleModal("editBot", false)}
        />
      )}
      {modals.rating && (
        <Rating
          habitatId={habitat.id}
          onClose={() => toggleModal("rating", false)}
        />
      )}
      {modals.configWelcome && <ConfigWelcome habitat={habitat} />}
    </div>
  );
}