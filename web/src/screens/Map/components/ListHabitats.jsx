import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../../../firebase";
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

  const handleDelete = async (habitatId, glbPath) => {
    try {
      // Delete the habitat document from Firestore
      await deleteDoc(doc(db, "habitats", habitatId));

      // Delete the GLB file from Firebase Storage
      const storageRef = ref(storage, glbPath);
      await deleteObject(storageRef);

      // Update the state to remove the deleted habitat
      setHabitats((prevHabitats) => prevHabitats.filter((habitat) => habitat.id !== habitatId));
    } catch (error) {
      console.error("Erro ao deletar habitat:", error);
    }
  };

  return (
    <div className="listHabitats-container">
      <h2>Meus Habitats</h2>
      <div className="habitats-list">
        {habitats.map((habitat) => (
          <div key={habitat.id} className="habitat-card">
            <div onClick={() => handleCardClick(habitat.id)}>
              {habitat.name}
            </div>
            <button onClick={() => handleDelete(habitat.id, habitat.glbPath)} className="delete-button">
              Deletar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}