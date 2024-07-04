import React, { useState, useEffect } from "react";
import { FaPlus, FaCompass } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../../../firebase";
import ModalCreateHabitat from "../ModalCreateHabitat/ModalCreateHabitat";
import ListHabitats from "../ListHabitats/ListHabitats";
import './Habitats.scss';

export default function Habitats({ user, setHabitat }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [habitats, setHabitats] = useState([]);

  useEffect(() => {
    const fetchHabitats = async () => {
      try {
        const habitatsCreatedQuery = query(collection(db, "habitats"), where("createdBy", "==", user.email));
        const habitatsMemberQuery = query(collection(db, "habitats"), where("members", "array-contains", user.email));

        const [createdSnapshot, memberSnapshot] = await Promise.all([
          getDocs(habitatsCreatedQuery),
          getDocs(habitatsMemberQuery)
        ]);

        const habitatsMap = new Map();

        createdSnapshot.forEach((doc) => {
          habitatsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        memberSnapshot.forEach((doc) => {
          if (!habitatsMap.has(doc.id)) {
            habitatsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });

        setHabitats(Array.from(habitatsMap.values()));
      } catch (error) {
        console.error("Erro ao buscar habitats: ", error);
      }
    };

    fetchHabitats();
  }, [user.email]);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
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
    if(isListModalOpen) {
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
        <div className="profile-menu">
          <button onClick={handleLogout}>Deslogar</button>
        </div>
      )}
      <div className="divider" />

      {habitats.length > 0 ? (
        habitats.map(habitat => (
          <div onClick={handleHabitatClick(habitat)} key={habitat.id} className="buttons habitat-item" style={{ backgroundImage: `url(${habitat.imageUrl})` }} />
        ))
      ) : (
        <></>
      )}

      <div className="divider" />

      <div className="buttons" onClick={openCreateModal}>
        <FaPlus size={20} />
      </div>
      <div className="buttons" onClick={toggleListModal}>
        <FaCompass size={20} />
      </div>

      {isCreateModalOpen && <ModalCreateHabitat onClose={closeCreateModal} userEmail={user.email} />}
      {isListModalOpen && <ListHabitats onClose={toggleListModal} userEmail={user.email} />}
    </div>
  );
}