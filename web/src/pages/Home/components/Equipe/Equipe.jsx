import React, { useEffect, useState } from "react";
import { FaPlus, FaEllipsisV } from "react-icons/fa";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./Equipe.scss";

export default function Equipe({ habitat, userEmail, setChatMember, setChatGroup, setChatBot, toggleModal, setSelectedMember, setSelectedGroup, setSelectedBot }) {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bots, setBots] = useState([]);

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

  return (
    <>
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
                <div className="member-item" onClick={() => handleMemberClick(member)}>
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
    </>
  );
}