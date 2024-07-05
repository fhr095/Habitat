import React, { useState, useEffect } from "react";
import { FaAngleDown, FaPlus } from "react-icons/fa";
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups"; // Importar o modal de grupos
import './Access.scss';

export default function Access({ habitat, userEmail, setChatMember, setChatGroup }) {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false); // Estado para o modal de grupos
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]); // Estado para os grupos
  const [selectedMember, setSelectedMember] = useState(null);

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

  const handleMemberRightClick = (event, member) => {
    event.preventDefault();
    if (habitat.createdBy === userEmail && member.email !== userEmail) {
      setSelectedMember(selectedMember && selectedMember.id === member.id ? null : member);
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
  }

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
              {habitat.createdBy === userEmail ? (
                <button onClick={handleDeleteHabitat}>Deletar Habitat</button>
              ) : (
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
              <div key={member.id} className="member-item" onClick={() => handleMemberClick(member)} onContextMenu={(e) => handleMemberRightClick(e, member)}>
                <img src={member.profileImageUrl} alt={member.name} />
                <div className="text">{member.name}</div>
                <span style={{ color: member.color }}>{member.tag}</span>
                {selectedMember && selectedMember.id === member.id && (
                  <div className="member-context-menu">
                    <button onClick={() => handleRemoveMember(member)}>Expulsar Membro</button>
                  </div>
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
              <div key={group.id} className="group-item" onClick={() => handleGroupClick(group)}>
                <img src={group.imgUrl} alt={group.name} />
                <div className="text">{group.name}</div>
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      </div>

      {isMembersModalOpen && <ModalAddMembers onClose={closeMembersModal} habitatId={habitat.id} />}
      {isGroupsModalOpen && <ModalAddGroups onClose={closeGroupsModal} habitatId={habitat.id} userEmail={userEmail} />}
    </div>
  );
}