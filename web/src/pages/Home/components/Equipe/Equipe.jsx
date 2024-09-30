import React, { useEffect, useState } from "react";
import { FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useHabitatUser } from "../../../../context/HabitatUserContext"; 
import "./Equipe.scss";

export default function Equipe() {
  const { habitat, user, setChatMember, setChatGroup, setChatBot } = useHabitatUser(); 
  const userEmail = user?.email;
  const [isAdmin, setIsAdmin] = useState(false);

  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bots, setBots] = useState([]);
  const [modals, setEquipeModals] = useState({
    members: false,
    groups: false,
    bots: false,
    editMember: false,
    editGroup: false,
    editBot: false,
  });

  useEffect(() => {
    console.log("Equipe rendered with context:", {
      habitat,
      userEmail,
      isAdmin,
      setChatMember,
      setChatGroup,
      setChatBot,
    });

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
        console.log("Members fetched:", membersData);
      });
    };

    const fetchGroups = () => {
      if (!habitat?.id || !userEmail) return;
      const q = query(collection(db, `habitats/${habitat.id}/groups`), where("users", "array-contains", userEmail));
      return onSnapshot(q, (querySnapshot) => {
        const groupsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGroups(groupsData);
        console.log("Groups fetched:", groupsData);
      });
    };

    const fetchBots = () => {
      if (!habitat?.id) return;
      const q = query(collection(db, `habitats/${habitat.id}/avatars`));
      return onSnapshot(q, (querySnapshot) => {
        const botsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBots(botsData);
        console.log("Bots fetched:", botsData);
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
    console.log("Member clicked:", member);
    if (member.email !== userEmail && setChatMember) {
      console.log("Setting chat member...");
      setChatMember(member);
    } else {
      console.error("setChatMember is not defined or member is current user");
    }
  };
  
  const handleGroupClick = (group) => {
    console.log("Group clicked:", group);
    if (setChatGroup) {
      console.log("Setting chat group...");
      setChatGroup(group);
    } else {
      console.error("setChatGroup is not defined");
    }
  };
  
  const handleBotClick = (bot) => {
    console.log("Bot clicked:", bot);
    if (setChatBot) {
      console.log("Setting chat bot...");
      setChatBot(bot);
    } else {
      console.error("setChatBot is not defined");
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
          {members.length > 0 ? (
            members.map((member) => (
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
          {isAdmin && (
            <button onClick={() => handleToggleModal("groups", true)}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="groups-list">
          {groups.length > 0 ? (
            groups.map((group) => (
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
          {isAdmin && (
            <button onClick={() => handleToggleModal("bots", true)}>
              <FaPlus size={15} />
            </button>
          )}
        </header>
        <div className="bots-list">
          {bots.length > 0 ? (
            bots.map((bot) => (
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
            ))
          ) : (
            <></>
          )}
        </div>
      </div>

      {modals.members && <ModalAddMembers onClose={() => handleToggleModal("members", false)} habitatId={habitat.id} />}
      {modals.groups && <ModalAddGroups onClose={() => handleToggleModal("groups", false)} habitatId={habitat.id} userEmail={userEmail} />}
      {modals.bots && <ModalAddBots onClose={() => handleToggleModal("bots", false)} habitatId={habitat.id} />}
      {modals.editMember && <ModalEditMember habitatId={habitat.id} selectedMember={setSelectedMember} onClose={() => handleToggleModal("editMember", false)} />}
      {modals.editGroup && <ModalEditGroup habitatId={habitat.id} selectedGroup={setSelectedGroup} onClose={() => handleToggleModal("editGroup", false)} />}
      {modals.editBot && <ModalEditBot selectedBot={setSelectedBot} ifcFileUrl={habitat.ifcFileUrl} onClose={() => handleToggleModal("editBot", false)} />}
    </>
  );
}
