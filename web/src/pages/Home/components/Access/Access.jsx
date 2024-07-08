import React, { useState, useEffect, useRef } from "react";
import { FaAngleDown, FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import ModalEditHabitat from "../ModalEditHabitat/ModalEditHabitat";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import './Access.scss';

export default function Access({ habitat, userEmail, setChatMember, setChatGroup }) {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editMemberDropdown, setEditMemberDropdown] = useState(null);
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

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const openEditMemberModal = () => {
    setIsEditMemberModalOpen(true);
  };

  const closeEditMemberModal = () => {
    setIsEditMemberModalOpen(false);
  };

  const toggleContextMenu = () => {
    setIsContextMenuOpen(prevState => !prevState);
  };

  const handleDeleteHabitat = async () => {
    try {
      const glbFileRef = ref(storage, habitat.glbFileUrl);
      await deleteObject(glbFileRef);

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
    } finally {
      setSelectedMember(null);
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

  return (
    <div className="access-container" onClick={() => setSelectedMember(null)}>
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
                        <button onClick={() => {
                          setSelectedMember(member.id)
                          openEditMemberModal()
                        }}>Editar Membro</button>
                        <button onClick={() => handleRemoveMember(member)}>Expulsar Membro</button>
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

      {isMembersModalOpen && <ModalAddMembers onClose={closeMembersModal} habitatId={habitat.id} />}
      {isGroupsModalOpen && <ModalAddGroups onClose={closeGroupsModal} habitatId={habitat.id} userEmail={userEmail} />}
      {isEditModalOpen && <ModalEditHabitat habitatId={habitat.id} onClose={closeEditModal} />}
      {isEditMemberModalOpen && <ModalEditMember habitatId={habitat.id} memberId={selectedMember} onClose={closeEditMemberModal} />}
    </div>
  );
}