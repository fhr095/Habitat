import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import Chat from "../components/Chat";
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

export default function SceneScreen({ isKioskMode }) {
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
  const renderer = useRef(null); // Inicializar como null
  const labelRenderer = useRef(null); // Inicializar como null
  const controls = useRef(null); // Inicializar como null
  const initialCameraPosition = useRef(new THREE.Vector3(0, 20, 50)); // Armazenar a posição inicial da câmera
  const initialControlsTarget = useRef(new THREE.Vector3(0, 0, 0)); // Armazenar o alvo inicial dos controles
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [showQuestionAndResponse, setShowQuestionAndResponse] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Estado para desabilitar o botão
  const [isResponseLoading, setIsResponseLoading] = useState(false); // Estado para indicar carregamento da resposta
  const [labels, setLabels] = useState([]); // Estado para armazenar os rótulos

  useEffect(() => {
    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    labelRenderer.current = new CSS2DRenderer();
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);

    camera.current.position.copy(initialCameraPosition.current);
    controls.current.target.copy(initialControlsTarget.current);
    setupScene();
    loadModel();
    window.addEventListener("resize", onWindowResize);

    const animateLoop = requestAnimationFrame(animate);

    return () => {
      if (
        mount.current &&
        renderer.current.domElement.parentNode === mount.current
      ) {
        mount.current.removeChild(renderer.current.domElement);
        mount.current.removeChild(labelRenderer.current.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop);
      disposeResources();
    };
  }, []);

  const setupScene = () => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(new THREE.Color("#fff"));
    labelRenderer.current.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.current.domElement.style.position = 'absolute';
    labelRenderer.current.domElement.style.top = '0px';
    labelRenderer.current.domElement.style.pointerEvents = 'none'; // Adicione esta linha
    mount.current.appendChild(renderer.current.domElement);
    mount.current.appendChild(labelRenderer.current.domElement);

    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 0.5;

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
    gltf.scene.position.x -= 20;
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
    camera.current.aspect = window.innerWidth / window.innerHeight;
    camera.current.updateProjectionMatrix();
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.current.setSize(window.innerWidth, window.innerHeight);
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

    scene.current.traverse((child) => {
      if (child.isMesh) {
        child.material.opacity = 0.5;
      }
    });

    setLabels([]); // Limpar rótulos
  };

  const focusOnLocation = (targetName, duration) => {
    let targetMesh = null;
    scene.current.traverse((child) => {
      if (
        child.isMesh &&
        child.name.includes(targetName.replace(/\s+/g, "_"))
      ) {
        targetMesh = child;
        targetMesh.material = targetMesh.material.clone();
        targetMesh.material.opacity = 1;
      } else if (child.isMesh) {
        child.material = child.material.clone();
        child.material.opacity = 0.05;
      }
    });

    if (targetMesh) {
      const targetPosition = new THREE.Vector3();
      targetMesh.getWorldPosition(targetPosition);
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = targetName;
      labelDiv.style.marginTop = '-1em';
      const label = new CSS2DObject(labelDiv);
      label.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      scene.current.add(label);
      setLabels((prevLabels) => [...prevLabels, label]);

      const tweenPosition = new TWEEN.Tween(camera.current.position)
        .to(
          {
            x: targetPosition.x + 10,
            y: targetPosition.y + 10,
            z: targetPosition.z + 10,
          },
          duration
        )
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => controls.current.update())
        .onComplete(() => {
          controls.current.target.copy(targetPosition);
          controls.current.update();
          setTimeout(() => {
            scene.current.remove(label);
            resetCameraAndTransparency(duration);
          }, 5000); // Remover o rótulo após 5 segundos
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
      resetCameraAndTransparency(duration);
    }
  };

  const sendPostRequest = (text) => {
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
      });
  };

  const processServerCommands = (commands) => {
    if (commands.length > 0) {
      setResponse(commands);
      console.log("Resposta da ia:", commands);
      setIsButtonDisabled(true); // Desabilitar botão ao iniciar resposta
      setIsResponseLoading(false); // Desabilitar o carregamento
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

  return (
    <div ref={mount} className={`scene ${isKioskMode ? "kiosk-mode" : ""}`}>
      {isLoading && <LoadingScreen />}
      {!isKioskMode && (
        <button
          className="chat-button"
          style={chatOpen ? { right: "40%" } : { right: "0" }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          <GoDiscussionClosed color="white" size={20} />
        </button>
      )}
      {chatOpen && <Chat isOpen={chatOpen} />}

      <div className="box-question-response">
        {transcript !== "" ? <Question question={transcript} showNotification={showQuestionAndResponse} /> : null}

        {isResponseLoading && <LoadingResponse />} {/* Mostrar LoadingResponse enquanto carrega */}
        {response.length > 0 && (
          <Response
            iaResponse={response}
            setIaReponse={setResponse}
            question={transcript}
            focusOnLocation={(targetName, duration) => focusOnLocation(targetName, duration)}
            onFinish={() => {
              setShowQuestionAndResponse(false);
              setIsButtonDisabled(false); // Habilitar botão ao finalizar resposta
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
            setTranscript(newTranscript);
            setShowQuestionAndResponse(true);
            setIsResponseLoading(true); // Ativar carregamento ao enviar a pergunta
            sendPostRequest(newTranscript);
          }}
          isDisabled={isButtonDisabled}
        />
      </div>
    </div>
  );
}