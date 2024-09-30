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
import Rating from "../Rating/Rating";
import "./Access.scss";

export default function Access({ habitat, userEmail, setChatMember, setChatGroup, setChatBot }) {
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
    };

    const fetchGroups = () => {
      const q = query(collection(db, `habitats/${habitat.id}/groups`), where("users", "array-contains", userEmail));
      return onSnapshot(q, (querySnapshot) => {
        const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(groupsData);
      });
    };

    const fetchBots = () => {
      const q = query(collection(db, `habitats/${habitat.id}/avatars`));
      return onSnapshot(q, (querySnapshot) => {
        const botsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    setModals(prevModals => ({
      ...prevModals,
      [modalName]: value,
    }));
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
                  <button onClick={() => toggleModal("rating", true)}>Avaliações</button>
                  <button onClick={() => toggleModal("edit", true)}>Editar Habitat</button>
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
            <button onClick={() => toggleModal("members", true)}>
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
                  <button className="edit-button" onClick={() => { setSelectedMember(member.id); toggleModal("editMember", true); }}>
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

      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Grupos</div>
          {habitat.createdBy === userEmail && (
            <button onClick={() => toggleModal("groups", true)}>
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
                  <button className="edit-button" onClick={() => { setSelectedGroup(group.id); toggleModal("editGroup", true); }}>
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

      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Bots e Assistentes</div>
          {habitat.createdBy === userEmail && (
            <button onClick={() => toggleModal("bots", true)}>
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
                  <button className="edit-button" onClick={() => { setSelectedBot(bot.avt); toggleModal("editBot", true); }}>
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

      {modals.members && <ModalAddMembers onClose={() => toggleModal("members", false)} habitatId={habitat.id} />}
      {modals.groups && <ModalAddGroups onClose={() => toggleModal("groups", false)} habitatId={habitat.id} userEmail={userEmail} />}
      {modals.bots && <ModalAddBots onClose={() => toggleModal("bots", false)} habitatId={habitat.id} />}
      {modals.edit && <ModalEditHabitat habitatId={habitat.id} onClose={() => toggleModal("edit", false)} />}
      {modals.editMember && <ModalEditMember habitatId={habitat.id} selectedMember={selectedMember} onClose={() => toggleModal("editMember", false)} />}
      {modals.editGroup && <ModalEditGroup habitatId={habitat.id} selectedGroup={selectedGroup} onClose={() => toggleModal("editGroup", false)} />}
      {modals.editBot && <ModalEditBot selectedBot={selectedBot} ifcFileUrl={habitat.ifcFileUrl} onClose={() => toggleModal("editBot", false)} />}
      {modals.rating && <Rating habitatId={habitat.id} onClose={() => toggleModal("rating", false)} />}
    </div>
  );
}
