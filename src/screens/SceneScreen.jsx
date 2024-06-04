import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import ChatContainer from '../components/ChatContainer';
import Question from "../components/Question";
import Response from "../components/Response";
import LoadingResponse from "../components/LoadingResponse";
import VoiceButton from "../components/VoiceButton";

import { GoHomeFill, GoDiscussionClosed } from "react-icons/go";

import "../styles/SceneScreen.scss";

const openDB = (name, version) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models");
      }
    };
  });
};

const getFromDB = (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const saveToDB = (db, storeName, key, value) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

// Variável global para armazenar o estado original dos materiais
let originalMaterials = new Map();
let focusQueue = [];
let isFocusing = false;

export default function SceneScreen({ isKioskMode, sceneWidthPercent = 1.3, sceneHeightPercent = 1.3 }) {
  const mount = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );
  const renderer = useRef(null);
  const labelRenderer = useRef(null);
  const controls = useRef(null);
  
  const initialCameraPosition = useRef(new THREE.Vector3(0, 20, 50));
  const initialControlsTarget = useRef(new THREE.Vector3(0, 0, 0));
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [showQuestionAndResponse, setShowQuestionAndResponse] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [labels, setLabels] = useState([]);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  /////////
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: '' });
  /////////

  useEffect(() => {
    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    labelRenderer.current = new CSS2DRenderer();
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);

    // Configuração inicial da cena
    renderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight * sceneHeightPercent);
    labelRenderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight * sceneHeightPercent);

    // Configuração inicial dos controles
    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 0.5;

    // Adiciona luz à cena
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);

    camera.current.position.copy(initialCameraPosition.current);
    controls.current.target.copy(initialControlsTarget.current);
    setupScene();
    loadModel();
    window.addEventListener("resize", onWindowResize);

    const animateLoop = requestAnimationFrame(animate);

    return () => {
      if (mount.current && renderer.current.domElement.parentNode === mount.current) {
        mount.current.removeChild(renderer.current.domElement);
        mount.current.removeChild(labelRenderer.current.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop);
      disposeResources();
    };
  }, []);

  const setupScene = () => {
    renderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight*sceneHeightPercent);
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5); // Aumenta a resolução
    renderer.current.setClearColor(new THREE.Color("#fff"));
    labelRenderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight*sceneHeightPercent);
    labelRenderer.current.domElement.style.position = 'absolute';
    labelRenderer.current.domElement.style.top = '0px';
    labelRenderer.current.domElement.style.pointerEvents = 'none';
    mount.current.appendChild(renderer.current.domElement);
    mount.current.appendChild(labelRenderer.current.domElement);

    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 2.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);
  };

  const applyMaterialSettings = (gltf) => {
    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        object.material.transparent = true;
        object.material.opacity = 0.5;
      }
    });
    //gltf.scene.position.x -= 30; // Ajustar ou remover conforme necessário
  };

  const loadModel = async () => {
    const loader = new GLTFLoader();
    const modelRef = ref(storage, "model/cidade_completa_mg.glb");

    const db = await openDB("ModelCache", 1);

    const cachedModel = await getFromDB(db, "models", "cidade_completa_mg");
    if (cachedModel) {
      console.log("Carregando modelo a partir do cache");
      loader.parse(cachedModel, "", (gltf) => {
        applyMaterialSettings(gltf);
        scene.current.add(gltf.scene);
        createInitialTag(gltf.scene); // Create initial tag after model is loaded
        setIsLoading(false);
      });
    } else {
      console.log("Carregando modelo a partir do Firebase Storage");
      getDownloadURL(modelRef)
        .then((url) => {
          fetch(url)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
              loader.parse(arrayBuffer, "", (gltf) => {
                applyMaterialSettings(gltf);
                scene.current.add(gltf.scene);
                createInitialTag(gltf.scene); // Create initial tag after model is loaded
                setIsLoading(false);
                saveToDB(db, "models", "cidade_completa_mg", arrayBuffer);
              });
            });
        })
        .catch((error) => {
          console.error("Erro ao carregar modelo GLB:", error);
        });
    }
  };

  const onWindowResize = () => {
    camera.current.aspect = (window.innerWidth * sceneWidthPercent) / (window.innerHeight*sceneHeightPercent);
    camera.current.updateProjectionMatrix();
    renderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight*sceneHeightPercent);
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5); // Aumenta a resolução
    labelRenderer.current.setSize(window.innerWidth * sceneWidthPercent, window.innerHeight*sceneHeightPercent);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.current.update();
    renderer.current.render(scene.current, camera.current);
    labelRenderer.current.render(scene.current, camera.current);
  };

  const resetCameraAndTransparency = (duration = 2000) => {
    new TWEEN.Tween(camera.current.position)
      .to(
        {
          x: initialCameraPosition.current.x,
          y: initialCameraPosition.current.y,
          z: initialCameraPosition.current.z,
        },
        duration
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => controls.current.update())
      .start();
  
    new TWEEN.Tween(controls.current.target)
      .to(
        {
          x: initialControlsTarget.current.x,
          y: initialControlsTarget.current.y,
          z: initialControlsTarget.current.z,
        },
        duration
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => controls.current.update())
      .start();
  
    originalMaterials.forEach((originalState, child) => {
      if (child.isMesh) {
        child.material.opacity = originalState.opacity;
        child.material.depthWrite = originalState.depthWrite;
      }
    });
  
    setLabels([]);
  };

  const focusOnLocation = (targetName, duration = 2000) => {
    focusQueue.push({ targetName, duration });
    if (!isFocusing) {
      processFocusQueue();
    }
  };

  const processFocusQueue = () => {
    if (focusQueue.length === 0) {
      isFocusing = false;
      return;
    }

    isFocusing = true;
    const { targetName, duration } = focusQueue.shift();

    labels.forEach(label => {
      scene.current.remove(label);
    });
    setLabels([]);

    // Definir todos os objetos como transparentes e depthWrite como false inicialmente
    scene.current.traverse((child) => {
      if (child.isMesh) {
        if (!originalMaterials.has(child)) {
          originalMaterials.set(child, {
            opacity: child.material.opacity,
            depthWrite: child.material.depthWrite,
          });
        }
        child.material = child.material.clone();
        child.material.opacity = 0.05;
        child.material.depthWrite = false;
      }
    });

    let targetMesh = null;
    scene.current.traverse((child) => {
      // Normaliza o nome do child removendo espaços extras e convertendo espaços e underscores para um único underscore
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_");

      // Normaliza o targetName da mesma maneira
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_");

      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMesh = child;

        if (child.isMesh) {
          child.material.opacity = 1;          
          child.material.depthWrite = true; // Definir depthWrite para true para o targetMesh
        }
      }
    });

    if (targetMesh) {
      const boundingBox = new THREE.Box3().setFromObject(targetMesh);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));

      cameraZ = 4; // Increase factor to ensure the object fits nicely in view

      const newCameraPosition = new THREE.Vector3(
        center.x,
        center.y + cameraZ * 0.5, // Adjust to be higher
        center.z + cameraZ
      );

      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = targetName;
      labelDiv.style.marginTop = '-1em';
      const label = new CSS2DObject(labelDiv);
      label.position.set(center.x, center.y, center.z);
      scene.current.add(label);
      setLabels([label]);

      console.log(`Starting focus animation for ${targetName} at ${new Date().toISOString()}`);
      new TWEEN.Tween(camera.current.position)
        .to(newCameraPosition, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          camera.current.lookAt(center);
          controls.current.target.copy(center);
          controls.current.update();
        })
        .onComplete(() => {
          console.log(`Completed focus animation for ${targetName} at ${new Date().toISOString()}`);
          controls.current.target.copy(center);
          controls.current.update();
          setTimeout(() => {
            scene.current.remove(label);
            resetCameraAndTransparency(duration);
            processFocusQueue(); // Processar a próxima chamada na fila
          }, Math.max(duration, 2000));
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
      resetCameraAndTransparency(duration);
      processFocusQueue(); // Processar a próxima chamada na fila
    }
  };

  const sendPostRequest = (text) => {
    setIsResponseLoading(true);
    fetch("https://roko.flowfuse.cloud/talkwithifc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ msg: text }),
    })
      .then((response) => response.json())
      .then((data) => {
        processServerCommands(data.comandos);
      })
      .catch((error) => {
        console.error("Erro ao enviar requisição POST:", error);
        setIsResponseLoading(false); // Parar o carregamento em caso de erro
      });
  };

  const processServerCommands = (commands) => {
    if (commands.length > 0) {
      setResponse(commands);
      console.log("Resposta da ia:", commands);
      setIsButtonDisabled(true);
      setIsResponseLoading(false);
    } else {
      console.error("Nenhum comando recebido da IA.");
    }
  };

  const disposeResources = () => {
    scene.current.children.forEach((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    });
    renderer.current.dispose();
    labelRenderer.current.dispose();
  };

  const createInitialTag = (model) => {
    const boundingBox = new THREE.Box3().setFromObject(model);
    const center = boundingBox.getCenter(new THREE.Vector3());

    const tagDiv = document.createElement('div');
    tagDiv.className = 'label';
    tagDiv.textContent = 'Você está aqui';
    tagDiv.style.marginTop = '-1em';
    const tagLabel = new CSS2DObject(tagDiv);
    tagLabel.position.set(center.x, center.y, center.z);
    scene.current.add(tagLabel);
  };

  return (
    <div className="screen-container"> {/* Adiciona um container para a tela */}
      <div ref={mount} className={`scene ${isKioskMode ? "kiosk-mode" : ""}`}>
        
      </div>
      {isLoading && <LoadingScreen />}
      <ChatContainer
        isOpen={chatOpen}
        onSearch={setSearchTerm}
        feedbackFilter={feedbackFilter}
        setFeedbackFilter={setFeedbackFilter}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        setChatOpen={setChatOpen}
      />
      
      <div className="box-question-response">
        {transcript !== "" ? <Question question={transcript} showNotification={showQuestionAndResponse} /> : null}

        {isResponseLoading && <LoadingResponse />}
        {response.length > 0 && (
          <Response
            iaResponse={response}
            setIaReponse={setResponse}
            question={transcript}
            focusOnLocation={(targetName, duration) => focusOnLocation(targetName, duration)}
            onFinish={() => {
              setShowQuestionAndResponse(false);
              setIsButtonDisabled(false);
            }}
          />
        )}
      </div>

      <div className="button-container">
        <button onClick={() => resetCameraAndTransparency()} className="home-button">
          <GoHomeFill color="white" size={20} />
        </button>
        <VoiceButton
          setTranscript={(newTranscript) => {
            console.log("Transcript:", newTranscript);
            setTranscript(newTranscript);
            setShowQuestionAndResponse(true);
            setIsResponseLoading(true);
            sendPostRequest(newTranscript);
          }}
          isDisabled={isButtonDisabled}
        />
      </div>
    </div>
  );
}
