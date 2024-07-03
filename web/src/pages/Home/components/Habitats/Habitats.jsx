import React, { useState, useEffect } from "react";
import { FaPlus, FaCompass } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import ModalCreateHabitat from "../ModalCreateHabtiat/ModalCreateHabitat";
import './Habitats.scss';

export default function Habitats({ user, setHabitat }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

        const fetchedHabitats = [];

        createdSnapshot.forEach((doc) => {
          fetchedHabitats.push({ id: doc.id, ...doc.data() });
        });

        memberSnapshot.forEach((doc) => {
          fetchedHabitats.push({ id: doc.id, ...doc.data() });
        });

        setHabitats(fetchedHabitats);
      } catch (error) {
        console.error("Erro ao buscar habitats: ", error);
      }
    };

    fetchHabitats();
  }, [user.email]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleHabitatClick = habitat => () => {
    setHabitat(habitat);
  };

  return (
    <div className="habitats-sidebar">
      <div className="buttons profile" style={{ backgroundImage: `url(${user.profileImageUrl})` }} />
      <div className="divider" />

      {habitats.length > 0 ? (
        habitats.map(habitat => (
          <div onClick={handleHabitatClick(habitat)} key={habitat.id} className="buttons habitat-item" style={{ backgroundImage: `url(${habitat.imageUrl})` }} />
        ))
      ) : (
        <p>Nenhum habitat encontrado.</p>
      )}

      <div className="divider" />

      <div className="buttons" onClick={openModal}>
        <FaPlus size={20} />
      </div>
      <div className="buttons">
        <FaCompass size={20} />
      </div>

      {isModalOpen && <ModalCreateHabitat onClose={closeModal} userEmail={user.email} />}
    </div>
  );
}