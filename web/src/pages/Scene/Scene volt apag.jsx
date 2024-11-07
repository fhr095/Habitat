import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import Response from "./components/Response/Response";
import Transcript from "./components/Transcript/Transcript";
import VoiceButton from "./components/VoiceButton/VoiceButton";

import "./Scene.scss";


export default function Scene({ habitatId, mainFileUrl, mobileFileUrl }) {
  const { id } = useParams();


  // Estados relacionados à interação
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  const [showQuestion, setShowQuestion] = useState(false);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isVoiceButtonPressed, setIsVoiceButtonPressed] = useState(false);
  const [isListening, setIsListening] = useState(false);

    // Function to handle start listening
  const handleStartListening = () => {
    setIsVoiceButtonPressed(true);
  };

  // Function to handle stop listening
  const handleStopListening = () => {
    setIsVoiceButtonPressed(false);
  };

  // Add a new useEffect to manage isListening
  useEffect(() => {
    if (isVoiceButtonPressed) {
      setIsListening(true);
      console.log("Ouvindo?:", isListening)
    } else {
      setIsListening(false);
    }
  }, [isVoiceButtonPressed]);

    // Resetar estados quando transcript estiver vazio
    useEffect(() => {
      if (transcript === "") {
        setIsListening(false);
      }
    }, [transcript]);

  return (
    <div className="scene-container">
      

      {/* Outros componentes */}
      <Response
        habitatId={id}
        avt={id}
        transcript={transcript}
        setTranscript={setTranscript}
        setFade={setFade}
        showQuestion={showQuestion}
        setShowQuestion={setShowQuestion}
        response={response}
        setResponse={setResponse}
        history={history}
        setHistory={setHistory}
      />

    
      {console.log(isListening,!showQuestion, transcript === '', isFinished)}
      {isListening && !showQuestion && transcript === ''/* && isFinished*/ && (
        <Transcript setTranscript={setTranscript} />
      )}   
          
      <VoiceButton
          isListening={isListening}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          isDisabled={false}
          transcript={transcript}
        />


    </div>
  );
}
