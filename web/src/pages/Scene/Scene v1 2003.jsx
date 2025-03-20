import React, { useEffect, useState, useRef, useCallback, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { saveInteraction } from "../../firebase";
import { v4 as uuidv4 } from "uuid";

import Model1 from "./components/Model/Model1";
import Model2 from "./components/Model/Model2";
import ModelSelector from "./components/Model/ModelSelector";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome";
import Transcript from "./components/Transcript/Transcript";
import Porcupine from "./components/Porcupine/Porcupine";
import SetupScene from "./components/SetupScene/SetupScene";
import VoiceButton from "./components/VoiceButton/VoiceButton";
import AnimationController from "./components/AnimationController/AnimationController";
import RotateIndicator from './components/RotateIndicator/RotateIndicator';
import WebCan from "./components/WebCan/WebCan";
import LocationLabel from "./components/LocationLabel/LocationLabel";

import { useSceneConfig } from "../../context/SceneConfigContext";
import { ModelContext } from "../../context/ModelContext";

import { VisualizationModeProvider, useVisualizationMode } from "../../context/VisualizationModeContext";
import ModeSwitcher from "./components/ModeSwitcher/ModeSwitcher";
import SketchConfigPanel from "./components/SketchConfigPanel/SketchConfigPanel";
import SketchRenderer from "./components/SketchRenderer/SketchRenderer";

// Importação do ObjectReferenceMapper
import { objectMapper } from "./utils/ObjectReferenceMapper";

import activationSound from '/sounds/button-on.mp3';

import "./Scene.scss";

// SVG Ícones para os botões rápidos
const BathroomIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="icon"
  >
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
  </svg>
);

const RestaurantIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="icon"
  >
    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
  </svg>
);

const FileUploadIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="icon"
  >
    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
  </svg>
);

// Componente principal
export default function Scene({ habitatId, mainFileUrl, mobileFileUrl }) {
  return (
    <VisualizationModeProvider>
      <SceneContent 
        habitatId={habitatId} 
        mainFileUrl={mainFileUrl} 
        mobileFileUrl={mobileFileUrl} 
      />
    </VisualizationModeProvider>
  );
}

// Separando o conteúdo da cena para evitar remontagens desnecessárias
function SceneContent({ habitatId, mainFileUrl, mobileFileUrl }) {
  const { id } = useParams();
  const { currentModel } = useContext(ModelContext);
  const { currentMode, switchMode } = useVisualizationMode();
  
  // Usamos o hook personalizado para acessar o contexto da cena
  const { 
    scene, 
    camera, 
    controls, 
    sceneConfig, 
    updateConfig, 
    updateObjectStatus 
  } = useSceneConfig();

  const [isValidUrl, setIsValidUrl] = useState(false);
  const [habitatData, setHabitatData] = useState({});

  const [modelUrl, setModelUrl] = useState("");
  const [modelUrlMain, setModelUrlMain] = useState(null);
  const [modelUrlMobile, setModelUrlMobile] = useState(null);
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [model1Loaded, setModel1Loaded] = useState(false);
  const [model2Loaded, setModel2Loaded] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  
  // Estados antigos, caso necessários para o Welcome ou outros componentes:
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [currentPerson, setCurrentPerson] = useState(null);
  
  const [showQuestion, setShowQuestion] = useState(false);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isPorcupine, setIsPorcupine] = useState(false);
  const [isScreenTouched, setIsScreenTouched] = useState(false);
  const [isVoiceButtonPressed, setIsVoiceButtonPressed] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [usersDetected, setUsersDetected] = useState([]);

  const resetScreenTouchTimerRef = useRef(null);
  const resetPorcupineTimerRef = useRef(null);
  const activationAudioRef = useRef(null);
  const resetTimerRef = useRef(null);
  const webCanRef = useRef(null);
  const model2Ref = useRef(null);
  const habitatDataFetchedRef = useRef(false);
  const modeTransitionRef = useRef({
    inProgress: false,
    lastMode: null
  });

  const [debugInfo, setDebugInfo] = useState({
    identifiedUsers: [],
    rawDetections: [],
    knownUsers: []
  });

  useEffect(() => {
    // Inicializa o depurador quando a cena é montada
    if (scene && currentMode) {
      console.log("Inicializando interface entre modos de visualização");
      window._debugSceneMode = {
        getStatus: () => ({ 
          currentMode, 
          model1Loaded,
          model2Loaded,
          model2Ref: !!model2Ref.current,
          transitionStatus: modeTransitionRef.current
        }),
        forceVisibility: () => {
          // Força visibilidade do modelo (útil para debugging)
          if (model2Ref.current) {
            model2Ref.current.visible = true;
            model2Ref.current.traverse(child => {
              if (child.isMesh || child.isGroup) {
                child.visible = true;
              }
            });
            return "Visibilidade forçada";
          }
          return "Modelo não disponível";
        }
      };
    }
  }, [scene, currentMode, model1Loaded, model2Loaded]);

  // Flag para evitar chamadas simultâneas
  const isCapturingRef = useRef(false);

  // Inicializa o som de ativação apenas uma vez
  useEffect(() => {
    if (!activationAudioRef.current) {
      activationAudioRef.current = new Audio(activationSound);
      activationAudioRef.current.volume = 1.0;
    }
    
    return () => {
      if (activationAudioRef.current) {
        activationAudioRef.current = null;
      }
    };
  }, []);

  // Handlers memoizados para evitar recriações desnecessárias
  const handleStartListening = useCallback(() => {
    setIsListening(true);
    if (activationAudioRef.current) {
      activationAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
    startOscillation("Peito");
  
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  
    resetTimerRef.current = setTimeout(() => {
      if (transcript === "") {
        setIsListening(false);
        stopOscillation("Peito");
        console.log("No audio detected after 7 seconds, resetting listening");
      }
    }, 7000);
  }, [transcript]);
  
  const handleStopListening = useCallback(() => {
    setIsListening(false);
    stopOscillation("Peito");
  
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  // Método otimizado para lidar com oscilação usando o método updateObjectStatus
  const toggleOscillation = useCallback((objectName, shouldOscillate) => {
    // Itera pelos modelos (model1, model2, both) para encontrar o objeto
    Object.keys(sceneConfig).forEach(modelType => {
      if (sceneConfig[modelType].bloomEffect && sceneConfig[modelType].bloomEffect.status) {
        const status = sceneConfig[modelType].bloomEffect.status;
        
        // Procura pelo objeto pelo nome
        Object.keys(status).forEach(uuid => {
          if (status[uuid].name === objectName) {
            // Atualiza o status de oscilação usando o método do contexto
            updateObjectStatus(modelType, uuid, { oscillate: shouldOscillate });
          }
        });
      }
    });
  }, [sceneConfig, updateObjectStatus]);
  
  const startOscillation = useCallback((objectName) => toggleOscillation(objectName, true), [toggleOscillation]);
  const stopOscillation = useCallback((objectName) => toggleOscillation(objectName, false), [toggleOscillation]);

  // Efeito para lidar com isListening
  useEffect(() => {
    if (isListening) {
      if (activationAudioRef.current) {
        activationAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
      startOscillation("Peito");
  
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  
      resetTimerRef.current = setTimeout(() => {
        if (transcript === "") {
          setIsListening(false);
          stopOscillation("Peito");
          console.log("No audio detected after 7 seconds, resetting listening");
        }
      }, 7000);
    } else {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
        stopOscillation("Peito");
      }
    }
  }, [isListening, transcript, startOscillation, stopOscillation]);

  // Efeito para lidar com transcript não vazio
  useEffect(() => {
    if (transcript !== '') {
      if (resetScreenTouchTimerRef.current) {
        clearTimeout(resetScreenTouchTimerRef.current);
        resetScreenTouchTimerRef.current = null;
        stopOscillation("Peito");
      }
      if (resetPorcupineTimerRef.current) {
        clearTimeout(resetPorcupineTimerRef.current);
        resetPorcupineTimerRef.current = null;
        stopOscillation("Peito");
      }
    }
  }, [transcript, stopOscillation]);

  // Efeito para buscar dados do habitat - Executado apenas uma vez
  useEffect(() => {
    if (habitatDataFetchedRef.current) return;
    
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);
  
        if (habitatDoc.exists()) {
          const data = habitatDoc.data();
          setHabitatData(data);
          console.log("habitatDocdata: ", data);
  
          const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
          const selectedUrl = isMobileDevice ? data.mobileFileUrl : data.mainFileUrl;
          setModelUrl(selectedUrl);
          setModelUrlMain(data.mainFileUrl);
          setModelUrlMobile(data.mobileFileUrl);
          setIsValidUrl(true);
        } else {
          console.error("No such document!");
          setModelUrlMobile("");
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };
  
    fetchHabitatData();
    habitatDataFetchedRef.current = true;
  }, [id]);

  // Efeito para configurar URLs do modelo com base em props
  useEffect(() => {
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
    } else {
      setIsValidUrl(false);
    }
  }, [habitatId, mainFileUrl, mobileFileUrl]);

  // Efeito para lidar com currentPerson
  useEffect(() => {
    if (!currentPerson) {
      setTranscript("");
      setIsPorcupine(false);
    }
  }, [currentPerson]);

  // Efeito para lidar com transcript vazio
  useEffect(() => {
    if (transcript === "") {
      setIsPorcupine(false);
      setIsScreenTouched(false);
      setIsListening(false);
    }
  }, [transcript]);

  // Callbacks memoizados para o carregamento do modelo
  const onLoadModel1 = useCallback(() => {
    console.log("Modelo 1 carregado!");
    setModel1Loaded(true);
  }, []);

  const onLoadModel2 = useCallback((modelScene) => {
    console.log("Modelo 2 carregado!");
    model2Ref.current = modelScene;
    setModel2Loaded(true);
  }, []);

  // Função para garantir a visibilidade do modelo2
  const ensureModel2Visibility = useCallback(() => {
    if (!model2Ref.current) return false;
    
    // Verificar se o modelo está na cena
    if (model2Ref.current.parent !== scene && scene) {
      scene.add(model2Ref.current);
      console.log("Modelo 2 re-adicionado à cena");
    }
    
    // Definir visibilidade com base no modelo atual
    const isVisible = currentModel === "model2" || currentModel === "both";
    model2Ref.current.visible = isVisible;
    
    // Forçar visibilidade de todos os objetos filhos
    let count = 0;
    model2Ref.current.traverse(child => {
      if (child.isMesh || child.isGroup) {
        if (!child.visible && child.name !== "Plane") {
          child.visible = true;
          count++;
        }
        
        // Limpar flags de ocultação
        if (child.userData && child.userData._hiddenBySketchMode) {
          delete child.userData._hiddenBySketchMode;
          count++;
        }
      }
    });
    
    console.log(`Visibilidade do modelo restaurada para ${count} objetos`);
    return count > 0;
  }, [scene, currentModel, model2Ref.current]);

  // Animação da key para efeito de digitação
  const [animationKey, setAnimationKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prevKey => prevKey + 1);
    }, 15000);
  
    return () => clearInterval(interval);
  }, []);

  // Efeito para inicializar o mapeador de objetos sempre que o modo visual mudar
  useEffect(() => {
    // Aguardar até que os modelos estejam carregados
    if (!model2Ref.current || !scene) return;
    
    // Rastrear transição de modo
    const isTransition = modeTransitionRef.current.lastMode !== currentMode;
    if (isTransition) {
      modeTransitionRef.current.inProgress = true;
      modeTransitionRef.current.lastMode = currentMode;
      
      console.log(`Transição de modo detectada: ${modeTransitionRef.current.lastMode || 'null'} -> ${currentMode}`);
    }
    
    // Aguardar um curto período após a mudança de modo para garantir que
    // todos os objetos sketch estejam inicializados
    const initTimeout = setTimeout(() => {
      // Se estamos voltando do modo sketch para o normal, garantir visibilidade
      if (currentMode === 'normal' && modeTransitionRef.current.inProgress) {
        ensureModel2Visibility();
        modeTransitionRef.current.inProgress = false;
        console.log("Visibilidade do modelo restaurada após retorno do modo sketch");
      }
      
      // Verificar se estamos no modo sketch e se o grupo sketch existe
      const sketchGroup = scene.children.find(child => child.name === "SketchModels");
      
      if (currentMode === 'sketch' && sketchGroup) {
        // Atualizar mapeamentos entre objetos normais e sketch
        objectMapper.buildMappings(model2Ref.current, scene);
        console.log("Mapeamento de objetos atualizado para modo sketch");
        modeTransitionRef.current.inProgress = false;
      }
    }, 300); // Pequeno atraso para garantir que tudo está renderizado
    
    return () => clearTimeout(initTimeout);
  }, [currentMode, model2Ref.current, scene, ensureModel2Visibility]);

  // Efeito para monitorar mudanças de visualização
  useEffect(() => {
    console.log("Visualization mode changed:", currentMode);
    
    if (currentMode === 'sketch') {
      // Após inicializar modo sketch, armazene referência ao renderer
      // para uso pelos sistemas de highlighting
      if (scene && world && world.renderer) {
        scene.userData = scene.userData || {};
        scene.userData.renderer = world.renderer;
      }
    } else {
      // Garantir que os controles estejam habilitados ao voltar para o modo normal
      if (world && world.controls) {
        world.controls.enabled = true;
      }
      
      // Garantir a visibilidade do modelo ao voltar para o modo normal
      if (model2Ref.current) {
        setTimeout(() => {
          ensureModel2Visibility();
        }, 200);
      }
    }
    
    // Limpar quaisquer efeitos temporários quando o modo muda
    const clearTemporaryEffects = () => {
      if (scene) {
        scene.children.forEach(child => {
          if (child.userData && child.userData.isTemporaryEffect) {
            scene.remove(child);
          }
        });
      }
    };
    
    clearTemporaryEffects();
    
  }, [currentMode, scene, world, ensureModel2Visibility]);

  // Efeito para verificar periodicamente a visibilidade do modelo em modo normal
  useEffect(() => {
    if (currentMode !== 'normal' || !model2Ref.current) return;
    
    // Verificar e corrigir visibilidade a cada segundo
    const visibilityCheckInterval = setInterval(() => {
      if (currentMode === 'normal' && model2Ref.current && !model2Ref.current.visible) {
        console.log("Detectada perda de visibilidade do modelo, restaurando...");
        ensureModel2Visibility();
      }
    }, 1000);
    
    return () => clearInterval(visibilityCheckInterval);
  }, [currentMode, model2Ref.current, ensureModel2Visibility]);

  // Efeito para capturar usuários quando o transcript é atualizado
  useEffect(() => {
    const captureUsers = async () => {
      if (transcript === "" || !webCanRef.current) return;

      if (isCapturingRef.current) {
        console.warn("Já está capturando usuários. Ignorando nova chamada.");
        return;
      }

      isCapturingRef.current = true;
      console.log("Iniciando captura de usuários...");

      try {
        const { identifiedUsers, rawDetections } = await webCanRef.current.captureCurrentUsers();
        setUsersDetected(identifiedUsers);

        const knownPersons = webCanRef.current.getKnownPersons();
        setDebugInfo({
          identifiedUsers,
          rawDetections,
          knownUsers: knownPersons
        });
      } catch (error) {
        console.error("Erro ao capturar usuários:", error);
      } finally {
        isCapturingRef.current = false;
      }
    };

    captureUsers();
  }, [transcript]);

  // Efeito para salvar interação no Firebase quando a resposta chega
  useEffect(() => {
    if (response && response.comandos && response.comandos.length > 0 && usersDetected.length > 0) {
      const question = transcript;
      const id_interaction = uuidv4();
      const ratings = null;
      const timestamp = Date.now();

      // Agrupar usersDetected por user.id
      const groupedUsers = usersDetected.reduce((acc, user) => {
        if (!acc[user.id]) {
          acc[user.id] = {
            ...user,
            emotionCounts: {}
          };
        }
        // Contar as ocorrências de cada emoção
        acc[user.id].emotionCounts[user.emotion] = (acc[user.id].emotionCounts[user.emotion] || 0) + 1;
        return acc;
      }, {});

      // Selecionar a emoção mais frequente para cada usuário
      const processedUsers = Object.values(groupedUsers).map(user => {
        const { emotionCounts, ...rest } = user;
        let selectedEmotion = "neutral"; // Valor padrão

        // Encontrar a emoção com maior contagem
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(emotionCounts)) {
          if (count > maxCount) {
            maxCount = count;
            selectedEmotion = emotion;
          }
        }

        return {
          ...rest,
          emotion: selectedEmotion
        };
      });

      console.log("Processed Users for Interaction:", processedUsers);

      // Salvar interação para cada usuário processado
      processedUsers.forEach(user => {
        const interactionData = {
          id_interaction,
          question,
          ratings,
          response_comandos: response.comandos,
          user_id: user.id,
          age: user.age,
          gender: user.gender,
          emotion: user.emotion,
          timestamp
        };
        saveInteraction(interactionData)
          .then(() => console.log(`Interação salva para usuário ${user.id}`))
          .catch(err => console.error("Erro ao salvar interação:", err));
      });
    }
  }, [response, transcript, usersDetected]);

  // Renderização da mensagem de boas-vindas
  const renderWelcomeMessage = useMemo(() => {
    if (!isListening && transcript === "") {
      return (
        <div className="welcome-container">
          <p className="welcome" key={animationKey}>
            <span className="typing">Olá, me faça uma pergunta!</span>
          </p>
        </div>
      );
    }
    return null;
  }, [isListening, transcript, animationKey]);

  // Renderização dos botões de perguntas rápidas
  const renderQuickButtons = useMemo(() => {
    if (transcript !== "") return null;
    
    return (
      <div className="buttons-container">
        <div className="fastButtons-list">
          <button
            onClick={() => setTranscript("Onde fica o banheiro mais próximo?")}
            onTouchStart={() => setTranscript("Onde fica o banheiro mais próximo?")}
            className="fastButton"
          >
            <BathroomIcon />
            <span>Onde fica o banheiro mais próximo?</span>
          </button>
          <button
            onClick={() => setTranscript("Estou com fome, onde me recomenda comer?")}
            onTouchStart={() => setTranscript("Estou com fome, onde me recomenda comer?")}
            className="fastButton"
          >
            <RestaurantIcon />
            <span>Estou com fome, onde me recomenda comer?</span>
          </button>
          <button
            onClick={() => setTranscript("Como faço para protocolar um projeto?")}
            onTouchStart={() => setTranscript("Como faço para protocolar um projeto?")}
            className="fastButton"
          >
            <FileUploadIcon />
            <span>Como faço para protocolar um projeto?</span>
          </button>
        </div>
      </div>
    );
  }, [transcript]);

  // Memoizar a estrutura do componente para evitar renderizações desnecessárias
  const memoizedSceneContent = useMemo(() => {
    return (
      <div className="scene-container">
        <RotateIndicator />
        
        {renderWelcomeMessage}

        {/* Setup da cena usando o componente refatorado */}
        <SetupScene
          modelUrl={modelUrl}
          setComponents={setComponents}
          setWorld={setWorld}
        />

        {components && world && modelUrlMain && modelUrlMain.length > 0 && (
          <Model1
            modelUrl={modelUrlMain}
            components={components}
            world={world}
            onLoad={onLoadModel1}
          />
        )}

        {components && world && modelUrlMobile && modelUrlMobile.length > 0 && (
          <Model2
            modelUrl={modelUrlMobile}
            components={components}
            world={world}
            onLoad={onLoadModel2}
          />
        )}

        {/* Renderizar o modo sketch se estiver ativo */}
        {currentMode === 'sketch' && components && world && model2Loaded && model2Ref.current && (
          <SketchRenderer 
            modelRef={model2Ref} 
            scene={world.scene} 
            camera={world.camera}
            renderer={world.renderer}
            world={world}
          />
        )}

        {components && world && model2Loaded && model2Ref.current && (
          <LocationLabel 
            world={world} 
            modelRef={model2Ref} 
            targetMeshName="Você_está_aqui"
          />
        )}

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

        {isListening && !showQuestion && transcript === '' && (
          <Transcript setTranscript={setTranscript} />
        )}

        {!isPorcupine && (
          <Porcupine setIsPorcupine={setIsPorcupine} />
        )}

        <AnimationController />

        <VoiceButton
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          isDisabled={false}
          transcript={transcript}
        />

        {renderQuickButtons}

        {components && world && model1Loaded && (
          <Welcome
            isPersonDetected={isPersonDetected}
            isPorcupine={isPorcupine}
            isScreenTouched={isScreenTouched}
            history={history}
            transcript={transcript}
            avt={id}
            persons={persons}
            setIsFinished={setIsFinished}
          />
        )}

        <WebCan ref={webCanRef} />

        {/* Interface de controle de modos */}
        <ModeSwitcher />
        
        {/* Painel de configuração para o modo sketch */}
        {currentMode === 'sketch' && <SketchConfigPanel />}
      </div>
    );
  }, [
    isListening, 
    transcript, 
    modelUrl, 
    modelUrlMain, 
    modelUrlMobile,
    components, 
    world, 
    model1Loaded, 
    model2Loaded,
    currentMode,
    model2Ref.current,
    showQuestion,
    isPorcupine,
    id,
    fade,
    history,
    response,
    isPersonDetected,
    isScreenTouched,
    persons,
    handleStartListening,
    handleStopListening,
    onLoadModel1,
    onLoadModel2,
    renderWelcomeMessage,
    renderQuickButtons
  ]);
  
  return memoizedSceneContent;
}