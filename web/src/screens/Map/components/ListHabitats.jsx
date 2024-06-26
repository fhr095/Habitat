import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import "../styles/ListHabitats.scss";

export default function ListHabitats({ user }) {
  const [habitats, setHabitats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHabitats = async () => {
      try {
        const q = query(collection(db, "habitats"), where("userEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        const habitatsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHabitats(habitatsList);
      } catch (error) {
        console.error("Erro ao buscar habitats:", error);
      }
    };

    fetchHabitats();
  }, [user.email]);

  const handleCardClick = (id) => {
    navigate(`/config?id=${id}`);
  };

  return (
    <div className="listHabitats-container">
      <h2>Meus Habitats</h2>
      <div className="habitats-list">
        {habitats.map((habitat) => (
          <div key={habitat.id} className="habitat-card" onClick={() => handleCardClick(habitat.id)}>
            {habitat.name}
          </div>
        ))}
      </div>
    </div>
  );
}