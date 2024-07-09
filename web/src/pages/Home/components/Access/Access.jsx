import React, { useState, useEffect } from "react";
import { FaAngleDown, FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import ModalAddBots from "../ModalAddBots/ModalAddBots";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalEditGroup from "../ModalEditGroup/ModalEditGroup";

import './Access.scss';

export default function Access({ habitat, userEmail, setChatMember, setChatGroup }) {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isBotsModalOpen, setIsBotsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [editMemberDropdown, setEditMemberDropdown] = useState(null);
  const [editGroupDropdown, setEditGroupDropdown] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = [];
        const q = query(collection(db, `habitats/${habitat.id}/members`));
        const querySnapshot = await getDocs(q);

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
      } catch (error) {
        console.error("Erro ao buscar membros: ", error);
      }
    };

    const fetchGroups = async () => {
      try {
        const q = query(collection(db, `habitats/${habitat.id}/groups`), where("users", "array-contains", userEmail));
        const querySnapshot = await getDocs(q);
        const groupsData = [];
        querySnapshot.forEach((doc) => {
          groupsData.push({ id: doc.id, ...doc.data() });
        });
        setGroups(groupsData);
      } catch (error) {
        console.error("Erro ao buscar grupos: ", error);
      }
    };

    fetchMembers();
    fetchGroups();
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

  const handleRemoveMember = async (member) => {
    try {
      const memberRef = doc(db, `habitats/${habitat.id}/members/${member.id}`);
      await deleteDoc(memberRef);

      setMembers(members.filter(m => m.id !== member.id));
      alert("Membro removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover membro: ", error);
    } 
  };

  const handleGroupClick = (group) => {
    setChatGroup(group);
  };

  const toggleEditMemberDropdown = (event, memberId) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.top + window.scrollY + rect.height,
      left: rect.left + window.scrollX + rect.width + 10 // Adds some space to the right
    });
    setEditMemberDropdown(editMemberDropdown === memberId ? null : memberId);
  };

  const toggleEditGroupDropdown = (event, groupId) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.top + window.scrollY + rect.height,
      left: rect.left + window.scrollX + rect.width + 10 // Adds some space to the right
    });
    setEditGroupDropdown(editGroupDropdown === groupId ? null : groupId);
  };

  const handleRemoveGroup = async (group) => {
    try {
      const groupRef = doc(db, `habitats/${habitat.id}/groups`, group.id);
      await deleteDoc(groupRef);

      setGroups(groups.filter(g => g.id !== group.id));
      alert("Grupo removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover grupo: ", error);
    }
  }

  return (
    <div className="access-container" onClick={(e) => {
      if (!e.target.closest('.edit-member-dropdown')) {
        setSelectedMember(null);
      }
      if (!e.target.closest('.edit-group-dropdown')) {
        setSelectedGroup(null);
      }
    }}>
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
                  <button onClick={openEditModal}>Editar Habitat</button>
                  <button onClick={handleDeleteHabitat}>Deletar Habitat</button>
                </>
              )}
              {habitat.createdBy !== userEmail && (
                <button onClick={handleLeaveHabitat}>Sair do Habitat</button>
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
                    <button className="edit-button" onClick={(e) => toggleEditMemberDropdown(e, member.id)}>
                      <FaEllipsisV size={15} />
                    </button>
                    {editMemberDropdown === member.id && (
                      <div className="edit-member-dropdown" style={dropdownStyle}>
                        <button onClick={() => openEditMemberModal(member.id)}>Editar Membro</button>
                        {habitat.createdBy !== member.email && (
                          <button onClick={() => handleRemoveMember(member)}>Remover Membro</button>
                        )}
                      </div>
                    )}
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
                    <button className="edit-button" onClick={(e) => toggleEditGroupDropdown(e, group.id)}>
                      <FaEllipsisV size={15} />
                    </button>
                    {editGroupDropdown === group.id && (
                      <div className="edit-group-dropdown" style={dropdownStyle}>
                        <button onClick={() => openEditGroupModal(group.id)}>Editar Grupo</button>
                        <button onClick={() => handleRemoveGroup(group)}>Remover Grupo</button>
                      </div>
                    )}
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
      </div>

      {isMembersModalOpen && <ModalAddMembers onClose={closeMembersModal} habitatId={habitat.id} />}
      {isGroupsModalOpen && <ModalAddGroups onClose={closeGroupsModal} habitatId={habitat.id} userEmail={userEmail} />}
      {isBotsModalOpen && <ModalAddBots onClose={closeBotsModal} habitatId={habitat.id} />}
      {isEditModalOpen && <ModalEditHabitat habitatId={habitat.id} onClose={closeEditModal} />}
      {isEditMemberModalOpen && <ModalEditMember habitatId={habitat.id} selectedMember={selectedMember} onClose={closeEditMemberModal} />}
      {isEditGroupModalOpen && <ModalEditGroup habitatId={habitat.id} selectedGroup={selectedGroup} onClose={closeEditGroupModal} />}
    </div>
  );
}