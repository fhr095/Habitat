// src/screens/SceneScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { ref, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import ChatContainer from "../components/ChatContainer";
import Question from "../components/Question";
import Response from "../components/Response";
import LoadingResponse from "../components/LoadingResponse";
import VoiceButton from "../components/VoiceButton";
import LoginRegisterModal from "../components/LoginRegisterModal";

import { GoHomeFill } from "react-icons/go";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

import "../styles/SceneScreen.scss";

// Funções de IndexedDB

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

export default function SceneScreen({
  isKioskMode,
  sceneWidthPercent = 1.3,
  sceneHeightPercent = 1.3,
  user,
}) {
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
  const [progress, setProgress] = useState(0);
  const [modalShow, setModalShow] = useState(false); // Estado para controle do modal

  const navigate = useNavigate(); // Hook de navegação
  const [currentUser, setUser] = useState(null); // Estado do usuário

  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: "" });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    labelRenderer.current = new CSS2DRenderer();
    controls.current = new OrbitControls(
      camera.current,
      renderer.current.domElement
    );

    // Configuração inicial da cena
    renderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );
    labelRenderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );

    // Configuração inicial dos controles
    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 1.5;

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

    //resete da camera para a posicao inicial a cada 10 minutos
    timeoutRef.current = setTimeout(() => {
      resetCameraAndTransparency();
    }, 600000);

    //zoom para um local aleatorio a cada 5 minutos
    timeoutRef.current = setTimeout(() => {
      zoomToRandomLocation();
    }, 300000);

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
    renderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5); // Aumenta a resolução
    renderer.current.setClearColor(new THREE.Color("#fff"));
    labelRenderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );
    labelRenderer.current.domElement.style.position = "absolute";
    labelRenderer.current.domElement.style.top = "0px";
    labelRenderer.current.domElement.style.pointerEvents = "none";
    mount.current.appendChild(renderer.current.domElement);
    mount.current.appendChild(labelRenderer.current.domElement);

    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 1.5;

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
  };

  const loadModel = async () => {
    const loader = new GLTFLoader();
    const modelRef = ref(storage, "model/cidade_completa_mg.glb");

    const db = await openDB("ModelCache", 1);

    const cachedModel = await getFromDB(db, "models", "cidade_completa_mg");
    if (cachedModel) {
      console.log("Carregando modelo a partir do cache");

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setProgress(Math.floor(progress));
      }, 100);

      loader.parse(cachedModel, "", (gltf) => {
        clearInterval(interval);
        applyMaterialSettings(gltf);
        scene.current.add(gltf.scene);
        createInitialTag(gltf.scene); // Create initial tag after model is loaded
        setIsLoading(false);
      });
    } else {
      console.log("Carregando modelo a partir do Firebase Storage");

      const xhr = new XMLHttpRequest();
      xhr.responseType = "arraybuffer";

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.floor(percentComplete));
        }
      };

      xhr.onload = (event) => {
        if (xhr.status === 200) {
          const arrayBuffer = xhr.response;
          loader.parse(arrayBuffer, "", (gltf) => {
            applyMaterialSettings(gltf);
            scene.current.add(gltf.scene);
            createInitialTag(gltf.scene); // Create initial tag after model is loaded
            setIsLoading(false);
            saveToDB(db, "models", "cidade_completa_mg", arrayBuffer);
          });
        } else {
          console.error("Erro ao carregar modelo GLB:", xhr.statusText);
        }
      };

      xhr.open("GET", await getDownloadURL(modelRef), true);
      xhr.send();
    }
  };

  const onWindowResize = () => {
    camera.current.aspect =
      (window.innerWidth * sceneWidthPercent) /
      (window.innerHeight * sceneHeightPercent);
    camera.current.updateProjectionMatrix();
    renderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5); // Aumenta a resolução
    labelRenderer.current.setSize(
      window.innerWidth * sceneWidthPercent,
      window.innerHeight * sceneHeightPercent
    );
  };

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.current.update();
    renderer.current.render(scene.current, camera.current);
    labelRenderer.current.render(scene.current, camera.current);
  };

  const resetCameraAndTransparency = (duration = 2000) => {
    isRotating = false; // Interrompe a rotação
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
    isRotating = false; // Interrompe a rotação
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

    labels.forEach((label) => {
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

    let targetMeshs = [];
    scene.current.traverse((child) => {
      // Normaliza o nome do child removendo espaços extras e convertendo espaços e underscores para um único underscore
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_");

      // Normaliza o targetName da mesma maneira
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_");

      if (
        (child.isMesh || child.isGroup) &&
        normalizedChildName.includes(normalizedTargetName)
      ) {
        targetMeshs.push(child);

        if (child.isMesh) {
          child.material.opacity = 1;
          child.material.depthWrite = true; // Definir depthWrite para true para o targetMesh
        } else if (child.isGroup) {
          child.traverse((groupChild) => {
            if (groupChild.isMesh) {
              groupChild.material.opacity = 1;
              groupChild.material.depthWrite = true;
            }
          });
        }
      }
    });

    if (targetMeshs.length > 0) {
      const boundingBox = new THREE.Box3();

      targetMeshs.forEach((mesh) => {
        boundingBox.expandByObject(mesh);
      });

      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.current.fov * (Math.PI / 180);
      const aspect = camera.current.aspect;
      let cameraZ = maxDim / (2 * Math.tan(fov / 2));

      // Adjust the cameraZ to ensure the entire object fits within the view, considering aspect ratio
      cameraZ = cameraZ / Math.min(1, aspect);

      const newCameraPosition = new THREE.Vector3(
        center.x,
        center.y + cameraZ * 0.5, // Adjust to be higher
        center.z + cameraZ
      );

      const labelDiv = document.createElement("div");
      labelDiv.className = "label";
      labelDiv.textContent = targetName;
      labelDiv.style.marginTop = "-1em";
      const label = new CSS2DObject(labelDiv);
      label.position.set(center.x, center.y, center.z);
      scene.current.add(label);
      setLabels([label]);

      new TWEEN.Tween(camera.current.position)
        .to(newCameraPosition, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          camera.current.lookAt(center);
          controls.current.target.copy(center);
          controls.current.update();
        })
        .onComplete(() => {
          controls.current.target.copy(center);
          controls.current.update();
          startRotatingAroundPoint(center); // Start rotating after focusing
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

  const zoomToRandomLocation = () => {
    const meshes = [];
    scene.current.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    if (meshes.length > 0) {
      const randomMesh = meshes[Math.floor(Math.random() * meshes.length)];
      focusOnLocation(randomMesh.name);
    }
  };

  let isRotating = false; // Variável para controlar a rotação

  const startRotatingAroundPoint = (point) => {
    isRotating = true;
    const radius = camera.current.position.distanceTo(point);
    const angle = -0.03; // Define the speed of rotation

    const rotate = () => {
      if (!isRotating) return; // Interrompe a rotação se isRotating for false

      const x = camera.current.position.x - point.x;
      const z = camera.current.position.z - point.z;
      const newX = x * Math.cos(angle) - z * Math.sin(angle);
      const newZ = x * Math.sin(angle) + z * Math.cos(angle);

      camera.current.position.x = newX + point.x;
      camera.current.position.z = newZ + point.z;
      camera.current.lookAt(point);
      controls.current.target.copy(point);
      controls.current.update();

      requestAnimationFrame(rotate);
    };

    rotate();
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
    if (labelRenderer.current.dispose) {
      labelRenderer.current.dispose();
    }
  };

  const createInitialTag = (model) => {
    // Encontrar o mesh do "Restaurante Meretíssimo"
    let targetMesh = null;
    model.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_");
      const normalizedTargetName = "Restaurante_Meretíssimo"
        .trim()
        .replace(/[\s_]+/g, "_");
      if (
        (child.isMesh || child.isGroup) &&
        normalizedChildName.includes(normalizedTargetName)
      ) {
        targetMesh = child;
      }
    });

    if (targetMesh) {
      const boundingBox = new THREE.Box3().setFromObject(targetMesh);
      const center = boundingBox.getCenter(new THREE.Vector3());

      const tagDiv = document.createElement("div");
      tagDiv.className = "label";
      tagDiv.textContent = "Você está aqui";
      tagDiv.style.marginTop = "-1em";
      const tagLabel = new CSS2DObject(tagDiv);
      tagLabel.position.set(center.x, center.y, center.z);
      scene.current.add(tagLabel);
    } else {
      console.error("Restaurante Meretíssimo não encontrado.");
    }
  };

  const handleLoginRegister = () => {
    setModalShow(true);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("Usuário deslogado com sucesso");
        setUser(null);
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
  };

  return (
    <div className="screen-container">
      {" "}
      {/* Adiciona um container para a tela */}
      <div
        ref={mount}
        className={`scene ${isKioskMode ? "kiosk-mode" : ""}`}
      ></div>
      {isLoading && <LoadingScreen progress={progress} />}
      {currentUser && (
        <ChatContainer
          isOpen={chatOpen}
          onSearch={setSearchTerm}
          feedbackFilter={feedbackFilter}
          setFeedbackFilter={setFeedbackFilter}
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          setChatOpen={setChatOpen}
        />
      )}
      <div className="box-question-response">
        {transcript !== "" ? (
          <Question
            question={transcript}
            showNotification={showQuestionAndResponse}
          />
        ) : null}

        {isResponseLoading && <LoadingResponse />}
        {response.length > 0 && (
          <Response
            iaResponse={response}
            setIaReponse={setResponse}
            question={transcript}
            focusOnLocation={(targetName, duration) =>
              focusOnLocation(targetName, duration)
            }
            onFinish={() => {
              setShowQuestionAndResponse(false);
              setIsButtonDisabled(false);
            }}
          />
        )}
      </div>
      <div className="button-container">
        <button
          onClick={() => resetCameraAndTransparency()}
          className="home-button"
        >
          <GoHomeFill color="white" size={20} />
        </button>
        <VoiceButton
          setTranscript={(newTranscript) => {
            setTranscript(newTranscript);
            setShowQuestionAndResponse(true);
            setIsResponseLoading(true);
            sendPostRequest(newTranscript);
          }}
          isDisabled={isButtonDisabled}
        />
      </div>
      <div className="login-container">
        {!currentUser ? (
          <button onClick={handleLoginRegister} className="login-button">
            Login/Cadastrar
            <FaSignInAlt color="#004736" size={20} />
          </button>
        ) : (
          <button onClick={handleLogout} className="login-button">
            Sair
            <FaSignOutAlt color="#004736" size={20} />
          </button>
        )}
      </div>
      <LoginRegisterModal show={modalShow} handleClose={() => setModalShow(false)} />
    </div>
  );
}