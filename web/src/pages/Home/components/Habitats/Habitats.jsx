import React, { useState, useEffect } from "react";
import { FaPlus, FaCompass } from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../../../firebase";
import ModalCreateHabitat from "../ModalCreateHabitat/ModalCreateHabitat";
import ListHabitats from "../ListHabitats/ListHabitats";
import './Habitats.scss';

export default function Habitats({ user, setHabitat }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [habitats, setHabitats] = useState([]);

  useEffect(() => {
    const habitatsMap = new Map();

    const fetchHabitatsRealTime = () => {
      // Query para habitats criados pelo usuário
      const habitatsCreatedQuery = query(
        collection(db, "habitats"),
        where("createdBy", "==", user.email)
      );

      // Listener para habitats criados pelo usuário
      const unsubscribeCreated = onSnapshot(habitatsCreatedQuery, (snapshot) => {
        snapshot.forEach((doc) => {
          habitatsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        setHabitats(Array.from(habitatsMap.values()));
      });

      // Listener para habitats onde o usuário é membro
      const unsubscribeMembers = onSnapshot(collection(db, "habitats"), (snapshot) => {
        snapshot.forEach(async (habitatDoc) => {
          const memberSnapshot = await onSnapshot(collection(db, `habitats/${habitatDoc.id}/members`), (membersSnapshot) => {
            membersSnapshot.forEach((memberDoc) => {
              if (memberDoc.id === user.email) {
                habitatsMap.set(habitatDoc.id, { id: habitatDoc.id, ...habitatDoc.data() });
                setHabitats(Array.from(habitatsMap.values()));
              }
            });
          });
        });
      });

      return () => {
        unsubscribeCreated();
        unsubscribeMembers();
      };
    };

    fetchHabitatsRealTime();
  }, [user.email]);

  const toggleCreateModal = () => {
    setIsCreateModalOpen(prevState => !prevState);
    setIsListModalOpen(false);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const toggleListModal = () => {
    setIsListModalOpen(prevState => !prevState);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(prevState => !prevState);
  };

  const handleHabitatClick = habitat => () => {
    if (isListModalOpen) {
      setIsListModalOpen(false);
      setHabitat(habitat.id);
    }
    setHabitat(prevHabitat => prevHabitat.id === habitat.id ? {} : habitat);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log("Usuário deslogado");
    }).catch((error) => {
      console.error("Erro ao deslogar: ", error);
    });
  };

  return (
    <div className="habitats-sidebar">
      <div className="buttons profile" style={{ backgroundImage: `url(${user.profileImageUrl})` }} onClick={toggleProfileMenu} />
      {isProfileMenuOpen && (
        <div className="dropdown">
          <button className="dropdown-item" onClick={handleLogout}>Deslogar</button>
        </div>
      )}
      
      {habitats.length > 0 && <div className="divider" />}

      {habitats.length > 0 && habitats.map(habitat => (
        <div onClick={handleHabitatClick(habitat)} key={habitat.id} className="buttons habitat-item" style={{ backgroundImage: `url(${habitat.imageUrl})` }} />
      ))}

      <div className="divider" />

      <div className="buttons" onClick={toggleCreateModal}>
        <FaPlus size={20} />
      </div>
      <div className="buttons button-map" onClick={toggleListModal}>
        <FaCompass size={20} />
      </div>

      {isCreateModalOpen && <ModalCreateHabitat onClose={closeCreateModal} userEmail={user.email} />}
      {isListModalOpen && <ListHabitats onClose={toggleListModal} userEmail={user.email} />}
    </div>
  );
}