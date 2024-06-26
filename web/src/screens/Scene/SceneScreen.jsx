import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";

import Scene from "./components/Scene";
import VoiceButton from "./components/VoiceButton";

import "./styles/SceneScreen.scss";

export default function SceneScreen() {
  const [glbPath, setGlbPath] = useState("");
  const [habitatId, setHabitatId] = useState("");
  const [transcript, setTranscript] = useState("");
  const location = useLocation();

  useEffect(() => {
    const fetchHabitatModel = async () => {
      const queryParams = new URLSearchParams(location.search);
      const id = queryParams.get("id");
      setHabitatId(id);

      if (id) {
        try {
          const habitatDocRef = doc(db, "habitats", id);
          const habitatDoc = await getDoc(habitatDocRef);
          if (habitatDoc.exists()) {
            const habitatData = habitatDoc.data();
            const modelRef = ref(storage, habitatData.glbPath);
            const url = await getDownloadURL(modelRef);
            setGlbPath(url);
          } else {
            console.error("Habitat não encontrado");
          }
        } catch (error) {
          console.error("Erro ao buscar modelo do habitat:", error);
        }
      }
    };

    fetchHabitatModel();
  }, [location]);

  return (
    <div className="SceneScreen-container">
      {glbPath && <Scene glbPath={glbPath} habitatId={habitatId} transcript={transcript}/>}

      <div className="buttons">
        <VoiceButton setTranscript={setTranscript}/>
      </div>
    </div>
  );
}