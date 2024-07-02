import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";

import Scene from "./components/Scene";
import VoiceButton from "./components/VoiceButton";
import Widget from "./components/Widget";
import Response from "./components/Response";

import { FaHome } from "react-icons/fa";
import "./styles/SceneScreen.scss";

export default function SceneScreen() {
  const [glbPath, setGlbPath] = useState("");
  const [habitatId, setHabitatId] = useState("");
  const [responses, setResponses] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState("");
  const location = useLocation();
  const [resetTrigger, setResetTrigger] = useState(false);

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

  const handleHomeButtonClick = (event) => {
    event.preventDefault(); // Prevent default form action
    setResetTrigger((prev) => !prev); // Toggle the reset trigger
  };

  return (
    <div className="SceneScreen-container">
      {glbPath && (
        <Scene
          glbPath={glbPath}
          habitatId={habitatId}
          transcript={transcript}
          setResponse={setResponses}
          fade={fade}
          resetTrigger={resetTrigger}
        />
      )}

      <div className="buttons">
        <button type="button" onClick={handleHomeButtonClick}>
          <FaHome size={30} />
        </button>
        <VoiceButton setTranscript={setTranscript} />
      </div>

      <Widget habitatId={habitatId} />

      <Response habitatId={habitatId} transcript={transcript} responses={responses} setFade={setFade} />
    </div>
  );
}