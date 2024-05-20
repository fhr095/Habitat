import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import Chat from "../components/Chat";
import Question from "../components/Question";
import Response from "../components/Response"; // Importando o componente correto
import VoiceButton from "../components/VoiceButton";

import { GoHomeFill, GoDiscussionClosed } from "react-icons/go";

import "../styles/SceneScreen.scss";

// Funções IndexedDB
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
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controls = useRef(new OrbitControls(camera.current, renderer.current.domElement));
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState([]); // Renomeando para response
  const [transcript, setTranscript] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    camera.current.position.set(0, 20, 50);
    setupScene();
    loadModel();
    window.addEventListener("resize", onWindowResize);
    const animateLoop = requestAnimationFrame(animate);

    return () => {
      if (mount.current && renderer.current.domElement.parentNode === mount.current) {
        mount.current.removeChild(renderer.current.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop);
      disposeResources();
    };
  }, []);

  const setupScene = () => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(new THREE.Color("#fff"));
    mount.current.appendChild(renderer.current.domElement);

    controls.current.enableZoom = false;
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
  };

  const loadModel = async () => {
    const loader = new GLTFLoader();
    const modelRef = ref(storage, "model/cidade_completa_mg.glb");

    // Abrir IndexedDB
    const db = await openDB("ModelCache", 1);

    // Verificar IndexedDB primeiro
    const cachedModel = await getFromDB(db, "models", "cidade_completa_mg");
    if (cachedModel) {
      console.log("Carregando modelo a partir do cache");
      loader.parse(cachedModel, '', (gltf) => {
        applyMaterialSettings(gltf);
        scene.current.add(gltf.scene);
        setIsLoading(false);
      });
    } else {
      console.log("Carregando modelo a partir do Firebase Storage");
      getDownloadURL(modelRef).then((url) => {
        fetch(url).then(response => response.arrayBuffer()).then(arrayBuffer => {
          loader.parse(arrayBuffer, '', (gltf) => {
            applyMaterialSettings(gltf);
            scene.current.add(gltf.scene);
            setIsLoading(false);
            saveToDB(db, "models", "cidade_completa_mg", arrayBuffer);
          });
        });
      }).catch((error) => {
        console.error("Erro ao carregar modelo GLB:", error);
      });
    }
  };

  const onWindowResize = () => {
    camera.current.aspect = window.innerWidth / window.innerHeight;
    camera.current.updateProjectionMatrix();
    renderer.current.setSize(window.innerWidth, window.innerHeight);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.current.update();
    renderer.current.render(scene.current, camera.current);
  };

  const resetCameraAndTransparency = () => {
    new TWEEN.Tween(camera.current.position)
      .to({ x: 0, y: 20, z: 50 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => controls.current.update())
      .onComplete(() => {
        scene.current.traverse((child) => {
          if (child.isMesh) {
            child.material.opacity = 0.5; // Reset object opacity
          }
        });
      })
      .start();
  };

  const focusOnLocation = (targetName) => {
    let targetMesh = null;
    scene.current.traverse((child) => {
      if (child.isMesh && child.name.includes(targetName.replace(/\s+/g, "_"))) {
        targetMesh = child;
        targetMesh.material = targetMesh.material.clone(); // Clone material to avoid conflicts
        targetMesh.material.opacity = 1; // Make target object opaque
      } else if (child.isMesh) {
        child.material = child.material.clone(); // Clone material to avoid conflicts
        child.material.opacity = 0.05; // Make the rest of the scene transparent
      }
    });

    if (targetMesh) {
      const targetPosition = new THREE.Vector3();
      targetMesh.getWorldPosition(targetPosition);
      const tweenPosition = new TWEEN.Tween(camera.current.position)
        .to({
          x: targetPosition.x,
          y: targetPosition.y + 10,
          z: targetPosition.z + 30,
        }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => controls.current.update())
        .onComplete(() => {
          setTimeout(() => {
            resetCameraAndTransparency();
          }, 5000); // Reset after 5 seconds
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
      resetCameraAndTransparency();
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
    .then(response => response.json())
    .then(data => {
      processServerCommands(data.comandos);
    })
    .catch(error => {
      console.error("Erro ao enviar requisição POST:", error);
    });
  };

  const processServerCommands = (commands) => {
    if (commands.length > 0) {
      setResponse(commands);
    }
  };

  const disposeResources = () => {
    scene.current.children.forEach(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    });
    renderer.current.dispose();
  };

  return (
    <div ref={mount} className={`scene ${isKioskMode ? 'kiosk-mode' : ''}`}>
      {isLoading && <LoadingScreen />}
      {!isKioskMode && (
        <button className='chat-button' style={chatOpen ? {right: "40%"} : {right:"0"}} onClick={() => setChatOpen(!chatOpen)}>
          <GoDiscussionClosed color="white" size={20} />
        </button>
      )}
      {chatOpen && <Chat isOpen={chatOpen} />}

      {transcript !== "" ? <Question question={transcript}/> : null}

      {response.length > 0 && <Response iaResponse={response} setIaReponse={setResponse} question={transcript} focusOnLocation={focusOnLocation} />}
      <div className="button-container">
        <button onClick={resetCameraAndTransparency} className="home-button">
          <GoHomeFill color="white" size={20} />
        </button>
        <VoiceButton
          setTranscript={(newTranscript) => {
            setTranscript(newTranscript);
            sendPostRequest(newTranscript);
          }}
        />
      </div>
    </div>
  );
}