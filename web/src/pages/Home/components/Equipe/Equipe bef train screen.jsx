import React, { useEffect, useState } from "react";
import { FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useHabitatUser } from "../../../../context/HabitatUserContext"; 
import "./Equipe.scss";
import ModalEditMember from "../ModalEditMember/ModalEditMember";
import ModalAddMembers from "../ModalAddMembers/ModalAddMembers";
import ModalEditGroup from "../ModalEditGroup/ModalEditGroup";
import ModalAddGroups from "../ModalAddGroups/ModalAddGroups";
import ModalEditBot from "../ModalEditBot/ModalEditBot";
import ModalAddBots from "../ModalAddBots/ModalAddBots";


export default function Equipe() {
  const { habitat, user, setChatMember, setChatGroup, setChatBot } = useHabitatUser(); 
  const userEmail = user?.email;
  const [isAdmin, setIsAdmin] = useState(false);

  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bots, setBots] = useState([]);
  
  // Estados para membros, grupos e bots selecionados
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedBot, setSelectedBot] = useState(null);

  const [modals, setEquipeModals] = useState({
    members: false,
    groups: false,
    bots: false,
    editMember: false,
    editGroup: false,
    editBot: false,
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
      setChatBot(bot);
    }
  };

  const handleToggleModal = (modalName, value) => {
    setEquipeModals((prevModals) => ({
      ...prevModals,
      [modalName]: value,
    }));
  };

  return (
    <>
      <div className="topics">
        <header>
          <div className="text">Membros</div>
          {isAdmin && (
            <button onClick={() => handleToggleModal("members", true)}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="members-list">
          {members.length > 0 && members.map((member) => (
            <div className="member-container" key={member.id}>
              <div className="member-item" onClick={() => handleMemberClick(member)}>
                <img src={member.profileImageUrl} alt={member.name} />
                <div className="text">{member.name}</div>
                <span style={{ color: member.color }}>{member.tag}</span>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={() => {
                    setSelectedMember(member.id);
                    handleToggleModal("editMember", true);
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Grupos</div>
          {isAdmin && (
            <button onClick={() => handleToggleModal("groups", true)}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="groups-list">
          {groups.length > 0 && groups.map((group) => (
            <div className="group-container" key={group.id}>
              <div className="group-item" onClick={() => handleGroupClick(group)}>
                <img src={group.imgUrl} alt={group.name} />
                <div className="text">{group.name}</div>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={() => {
                    setSelectedGroup(group.id);
                    handleToggleModal("editGroup", true);
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />
      <div className="topics">
        <header>
          <div className="text">Bots e Assistentes</div>
          {isAdmin && (
            <button onClick={() => handleToggleModal("bots", true)}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="bots-list">
          {bots.length > 0 && bots.map((bot) => (
            <div className="bot-container" key={bot.id}>
              <div className="bot-item" onClick={() => handleBotClick(bot)}>
                <img src={bot.imageUrl} alt={bot.name} />
                <div className="text">{bot.name}</div>
              </div>
              {isAdmin && (
                <button
                  className="edit-button"
                  onClick={() => {
                    setSelectedBot(bot.id);
                    handleToggleModal("editBot", true);
                  }}
                >
                  <FaEllipsisV size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {modals.members && <ModalAddMembers onClose={() => handleToggleModal("members", false)} habitatId={habitat.id} />}
      {modals.groups && <ModalAddGroups onClose={() => handleToggleModal("groups", false)} habitatId={habitat.id} userEmail={userEmail} />}
      {modals.bots && <ModalAddBots onClose={() => handleToggleModal("bots", false)} habitatId={habitat.id} />}
      
      {modals.editMember && (
        <ModalEditMember
          habitatId={habitat.id}
          selectedMember={selectedMember}
          onClose={() => handleToggleModal("editMember", false)}
        />
      )}
      {modals.editGroup && (
        <ModalEditGroup
          habitatId={habitat.id}
          selectedGroup={selectedGroup}
          onClose={() => handleToggleModal("editGroup", false)}
        />
      )}
      {modals.editBot && (
        <ModalEditBot
          selectedBot={selectedBot}
          ifcFileUrl={habitat.ifcFileUrl}
          onClose={() => handleToggleModal("editBot", false)}
        />
      )}
    </>
  );
}
