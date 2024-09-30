import React, { useState, useEffect } from "react";
import { FaPlus, FaCompass } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../../../firebase";
import ModalCreateHabitat from "../ModalCreateHabitat/ModalCreateHabitat";
import ListHabitats from "../ListHabitats/ListHabitats";
import { useHabitatUser } from "../../../../context/HabitatUserContext";
import './Habitats.scss';

export default function Habitats() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [habitats, setHabitats] = useState([]);
  
  const { user, setHabitat } = useHabitatUser(); // Agora usando o contexto para acessar user e setHabitat

  useEffect(() => {
    const fetchHabitats = async () => {
      if (!user?.email) return; // Verifica se user.email está definido

      try {
        const habitatsCreatedQuery = query(collection(db, "habitats"), where("createdBy", "==", user.email));
        const habitatsCollectionSnapshot = await getDocs(collection(db, "habitats"));

        const habitatsMap = new Map();

        // Adicionar habitats criados pelo usuário
        const createdSnapshot = await getDocs(habitatsCreatedQuery);
        createdSnapshot.forEach((doc) => {
          habitatsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // Verificar habitats onde o usuário é membro
        for (const habitatDoc of habitatsCollectionSnapshot.docs) {
          const memberDoc = await getDocs(collection(db, `habitats/${habitatDoc.id}/members`));
          memberDoc.forEach((doc) => {
            if (doc.id === user.email) {
              habitatsMap.set(habitatDoc.id, { id: habitatDoc.id, ...habitatDoc.data() });
            }
          });
        }

        setHabitats(Array.from(habitatsMap.values()));
      } catch (error) {
        console.error("Erro ao buscar habitats: ", error);
      }
    };

    fetchHabitats();
  }, [user?.email]);

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
      
      {habitats.length > 0 ? (
        habitats.map(habitat => (
          <div onClick={handleHabitatClick(habitat)} key={habitat.id} className="buttons habitat-item" style={{ backgroundImage: `url(${habitat.imageUrl})` }} />
        ))
      ) : null}

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
