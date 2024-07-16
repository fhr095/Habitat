import React, { useState, useEffect } from "react";
import { FaAngleDown, FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, doc, updateDoc, arrayRemove, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import ModalAddBots from "../ModalAddBots/ModalAddBots";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalEditGroup from "../ModalEditGroup/ModalEditGroup";
import ModalEditBot from "../ModalEditBot/ModalEditBot";

import './Access.scss';

export default function Access({ habitat, userEmail, setChatMember, setChatGroup, setChatBot }) {
  const navigate = useNavigate();
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isBotsModalOpen, setIsBotsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isEditBotModalOpen, setIsEditBotModalOpen] = useState(false);
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
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const membersData = [];
        for (const memberDoc of querySnapshot.docs) {
          const memberData = memberDoc.data();
          const userQuery = query(collection(db, "users"), where("email", "==", memberData.email));
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
      return () => unsubscribe();
    };

    const fetchGroups = () => {
      const q = query(collection(db, `habitats/${habitat.id}/groups`), where("users", "array-contains", userEmail));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const groupsData = [];
        querySnapshot.forEach((doc) => {
          groupsData.push({ id: doc.id, ...doc.data() });
        });
        setGroups(groupsData);
      });
      return () => unsubscribe();
    };

    const fetchBots = () => {
      const q = query(collection(db, `habitats/${habitat.id}/avatars`));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const botsData = [];
        querySnapshot.forEach((doc) => {
          botsData.push({ id: doc.id, ...doc.data() });
        });
        setBots(botsData);
      });
      return () => unsubscribe();
    };

    const unsubscribeMembers = fetchMembers();
    const unsubscribeGroups = fetchGroups();
    const unsubscribeBots = fetchBots();

    return () => {
      unsubscribeMembers();
      unsubscribeGroups();
      unsubscribeBots();
    };
  }, [habitat.id, userEmail]);

  const openMembersModal = () => {
    setIsMembersModalOpen(true);
  };

  const closeMembersModal = () => {
    setIsMembersModalOpen(false);
  };

  const openGroupsModal = () => {
    setIsGroupsModalOpen(true);
  };

  const closeGroupsModal = () => {
    setIsGroupsModalOpen(false);
  };

  const openBotsModal = () => {
    setIsBotsModalOpen(true);
  };

  const closeBotsModal = () => {
    setIsBotsModalOpen(false);
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const openEditMemberModal = (memberId) => {
    setSelectedMember(memberId);
    setIsEditMemberModalOpen(true);
  };

  const closeEditMemberModal = () => {
    setIsEditMemberModalOpen(false);
  };

  const openEditGroupModal = (groupId) => {
    setSelectedGroup(groupId);
    setIsEditGroupModalOpen(true);
  };

  const closeEditGroupModal = () => {
    setIsEditGroupModalOpen(false);
  };

  const openEditBotModal = (botAvt) => {
    setSelectedBot(botAvt);
    setIsEditBotModalOpen(true);
  };

  const closeEditBotModal = () => {
    setIsEditBotModalOpen(false);
  };

  const toggleContextMenu = () => {
    setIsContextMenuOpen(prevState => !prevState);
  };

  const handleDeleteHabitat = async () => {
    try {
      const habitatRef = doc(db, "habitats", habitat.id);
  
      // Deletar subcoleção de membros
      const membersCollection = collection(habitatRef, "members");
      const membersSnapshot = await getDocs(membersCollection);
      const deleteMembersPromises = membersSnapshot.docs.map(member => deleteDoc(member.ref));
      await Promise.all(deleteMembersPromises);
  
      // Deletar subcoleção de grupos e suas subcoleções de mensagens
      const groupsCollection = collection(habitatRef, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
      const deleteGroupsPromises = groupsSnapshot.docs.map(async (group) => {
        const messagesCollection = collection(group.ref, "messages");
        const messagesSnapshot = await getDocs(messagesCollection);
        const deleteMessagesPromises = messagesSnapshot.docs.map(message => deleteDoc(message.ref));
        await Promise.all(deleteMessagesPromises);
        return deleteDoc(group.ref);
      });
      await Promise.all(deleteGroupsPromises);
  
      // Deletar subcoleção de conversas e suas subcoleções de mensagens
      const conversationsCollection = collection(habitatRef, "conversations");
      const conversationsSnapshot = await getDocs(conversationsCollection);
      const deleteConversationsPromises = conversationsSnapshot.docs.map(async (conversation) => {
        const messagesCollection = collection(conversation.ref, "messages");
        const messagesSnapshot = await getDocs(messagesCollection);
        const deleteMessagesPromises = messagesSnapshot.docs.map(message => deleteDoc(message.ref));
        await Promise.all(deleteMessagesPromises);
        return deleteDoc(conversation.ref);
      });
      await Promise.all(deleteConversationsPromises);
  
      // Deletar o arquivo GLB do Storage
      const glbFileRef = ref(storage, habitat.glbFileUrl);
      await deleteObject(glbFileRef);
  
      // Deletar o documento do habitat do Firestore
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
                  <button onClick={openEditModal}>Editar Habitat</button>
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

      <div className="topics">
        <header>
          <div className="text">Membros</div>
          {habitat.createdBy === userEmail && (
            <button onClick={openMembersModal}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="members-list">
          {members.length > 0 ? (
            members.map(member => (
              <div className="member-container" key={member.id}>
                <div className="member-item" onClick={() => handleMemberClick(member)} >
                  <img src={member.profileImageUrl} alt={member.name} />
                  <div className="text">{member.name}</div>
                  <span style={{ color: member.color }}>{member.tag}</span>
                </div>
                {habitat.createdBy === userEmail && (
                  <>
                    <button className="edit-button" onClick={() => openEditMemberModal(member.id)}>
                      <FaEllipsisV size={15} />
                    </button>
                  </>
                )}
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
          <div className="text">Grupos</div>

          {habitat.createdBy === userEmail && (
            <button onClick={openGroupsModal}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="groups-list">
          {groups.length > 0 ? (
            groups.map(group => (
              <div className="group-container" key={group.id}>
                <div className="group-item" onClick={() => handleGroupClick(group)}>
                  <img src={group.imgUrl} alt={group.name} />
                  <div className="text">{group.name}</div>
                </div>
                {habitat.createdBy === userEmail && (
                  <>
                    <button className="edit-button" onClick={() => openEditGroupModal(group.id)}>
                      <FaEllipsisV size={15} />
                    </button>
                  </>
                )}
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
          <div className="text">Bots e Assistentes</div>

          {habitat.createdBy === userEmail && (
            <button onClick={openBotsModal}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="bots-list">
          {bots.length > 0 ? (
            bots.map(bot => (
              <div className="bot-container" key={bot.id}>
                <div className="bot-item" onClick={() => handleBotClick(bot)}>
                  <img src={bot.imageUrl} alt={bot.name} />
                  <div className="text">{bot.name}</div>
                </div>
                {habitat.createdBy === userEmail && (
                  <>
                    <button className="edit-button" onClick={() => openEditBotModal(bot.avt)}>
                      <FaEllipsisV size={15} />
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      </div>

      {isMembersModalOpen && <ModalAddMembers onClose={closeMembersModal} habitatId={habitat.id} />}
      {isGroupsModalOpen && <ModalAddGroups onClose={closeGroupsModal} habitatId={habitat.id} userEmail={userEmail} />}
      {isBotsModalOpen && <ModalAddBots onClose={closeBotsModal} habitatId={habitat.id} />}
      {isEditModalOpen && <ModalEditHabitat habitatId={habitat.id} onClose={closeEditModal} />}
      {isEditMemberModalOpen && <ModalEditMember habitatId={habitat.id} selectedMember={selectedMember} onClose={closeEditMemberModal} />}
      {isEditGroupModalOpen && <ModalEditGroup habitatId={habitat.id} selectedGroup={selectedGroup} onClose={closeEditGroupModal} />}
      {isEditBotModalOpen && <ModalEditBot selectedBot={selectedBot} glbFileUrl={habitat.glbFileUrl} onClose={closeEditBotModal} />}
    </div>
  );
}