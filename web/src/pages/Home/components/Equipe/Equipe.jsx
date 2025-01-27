import React, { useEffect, useState } from "react";
import { FaPlus, FaEllipsisV, FaArrowLeft } from "react-icons/fa";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useHabitatUser } from "../../../../context/HabitatUserContext";
import "./Equipe.scss";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalEditGroup from "../ModalEditGroup/ModalEditGroup";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import ModalAddBots from "../ModalAddBots/ModalAddBots";
import EditBotPanel from "../EditBotPanel/EditBotPanel";

export default function Equipe() {
  const { habitat, user, setChatMember, setChatGroup, setChatBot } = useHabitatUser();
  const userEmail = user?.email;
  const [isAdmin, setIsAdmin] = useState(false);

  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bots, setBots] = useState([]);

  // Estados para navegação e seleção
  const [viewMode, setViewMode] = useState("list"); // 'list' ou 'edit'
  const [selectedBot, setSelectedBot] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [modals, setEquipeModals] = useState({
    members: false,
    groups: false,
    bots: false,
    editMember: false,
    editGroup: false,
  });

  useEffect(() => {
    if (habitat?.createdBy === userEmail) {
      setIsAdmin(true);
    }

    const fetchMembers = () => {
      if (!habitat?.id) return;
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
      if (!habitat?.id || !userEmail) return;
      const q = query(collection(db, `habitats/${habitat.id}/groups`), where("users", "array-contains", userEmail));
      return onSnapshot(q, (querySnapshot) => {
        const groupsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGroups(groupsData);
      });
    };

    const fetchBots = () => {
      if (!habitat?.id) return;
      const q = query(collection(db, `habitats/${habitat.id}/avatars`));
      return onSnapshot(q, (querySnapshot) => {
        const botsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  }, [habitat?.id, userEmail]);

  const handleMemberClick = (member) => {
    if (member.email !== userEmail && setChatMember) {
      setChatMember(member);
    }
  };

  const handleGroupClick = (group) => {
    if (setChatGroup) {
      setChatGroup(group);
    }
  };

  const handleBotClick = (bot) => {
    if (setChatBot) {
      setChatBot(bot); // Define o bot no contexto de chat
    }
  };

  const handleBotEdit = (bot) => {
    setSelectedBot(bot);
    setViewMode("edit"); // Alterna para o painel de edição
  };

  const handleBackToList = () => {
    setViewMode("list"); // Retorna à lista
    setSelectedBot(null);
  };

  if (viewMode === "edit") {
    return (
      <div className="edit-bot-panel-container">
        <button className="back-button" onClick={handleBackToList}>
          <FaArrowLeft /> Voltar
        </button>
        <EditBotPanel selectedBot={selectedBot} ifcFileUrl={habitat.ifcFileUrl} />
      </div>
    );
  }

  return (
    <>
      {/* Membros */}
      <div className="topics">
        <header>
          <div className="text">Membros</div>
          {isAdmin && (
            <button onClick={() => setEquipeModals((prev) => ({ ...prev, members: true }))}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="members-list">
          {members.map((member) => (
            <div className="member-container" key={member.id}>
              <div className="member-item" onClick={() => handleMemberClick(member)}>
                <img src={member.profileImageUrl} alt={member.name} />
                <div className="text">{member.name}</div>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={() => {
                    setSelectedMember(member);
                    setEquipeModals((prev) => ({ ...prev, editMember: true }));
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grupos */}
      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Grupos</div>
          {isAdmin && (
            <button onClick={() => setEquipeModals((prev) => ({ ...prev, groups: true }))}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="groups-list">
          {groups.map((group) => (
            <div className="group-container" key={group.id}>
              <div className="group-item" onClick={() => handleGroupClick(group)}>
                <img src={group.imgUrl} alt={group.name} />
                <div className="text">{group.name}</div>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={() => {
                    setSelectedGroup(group);
                    setEquipeModals((prev) => ({ ...prev, editGroup: true }));
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bots */}
      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Bots e Assistentes</div>
          {isAdmin && (
            <button onClick={() => setEquipeModals((prev) => ({ ...prev, bots: true }))}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="bots-list">
          {bots.map((bot) => (
            <div className="bot-container" key={bot.id}>
              <div
                className="bot-item"
                onClick={() => handleBotClick(bot)} // Clique para abrir o chat
              >
                <img src={bot.imageUrl} alt={bot.name} />
                <div className="text">{bot.name}</div>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita abrir o chat ao clicar no botão de edição
                    handleBotEdit(bot); // Alterna para o painel de edição
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {modals.members && <ModalAddMembers onClose={() => setEquipeModals((prev) => ({ ...prev, members: false }))} habitatId={habitat.id} />}
      {modals.groups && <ModalAddGroups onClose={() => setEquipeModals((prev) => ({ ...prev, groups: false }))} habitatId={habitat.id} />}
      {modals.bots && <ModalAddBots onClose={() => setEquipeModals((prev) => ({ ...prev, bots: false }))} habitatId={habitat.id}/>}
      {modals.editMember && (
        <ModalEditMember
          habitatId={habitat.id}
          selectedMember={selectedMember}
          onClose={() => setEquipeModals((prev) => ({ ...prev, editMember: false }))}
        />
      )}
      {modals.editGroup && (
        <ModalEditGroup
          habitatId={habitat.id}
          selectedGroup={selectedGroup}
          onClose={() => setEquipeModals((prev) => ({ ...prev, editGroup: false }))}
        />
      )}
    </>
  );
}
