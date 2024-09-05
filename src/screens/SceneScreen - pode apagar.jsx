import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import Question from "../components/Question";
import Response from "../components/Response";
import LoadingResponse from "../components/LoadingResponse";
import VoiceButton from "../components/VoiceButton";

import { GoHomeFill } from "react-icons/go";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

import "../styles/SceneScreen.scss";


// Variável global para armazenar o estado original dos materiais

const clock = new THREE.Clock();

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
  const [showQuestionAndResponse, setShowQuestionAndResponse] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const timeoutRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const [currentUser, setUser] = useState(null); // Estado do usuário

 

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

    const isMobileDevice = () => {
      return /Mobi|Android/i.test(navigator.userAgent);
    };
  
    if (isMobileDevice()) {
      initialCameraPosition.current.set(10, 60, 150); // Ajuste o valor conforme necessário para a versão mobile
    }
  
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
    const isMobileDevice = () => {
      return /Mobi|Android/i.test(navigator.userAgent);
    };

    // Seleção do caminho do modelo com base no dispositivo
    const modelPath = isMobileDevice() ? "model/teste2.glb" : "model/cidade_completa_mg.glb";
    const modelRef = ref(storage, modelPath);
  
    const db = await openDB("ModelCache", 1);
  
    const cachedModel = await getFromDB(db, "models", "cidade_completa_mg");
    if (cachedModel) {
      console.log("Carregando modelo a partir do cache");
  
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setProgress(Math.floor(progress));
        if (progress >= 100) {
          clearInterval(interval);
          setProgress(100); // Garanta que o progresso seja exatamente 100%
        }
      }, 100);
  
      loader.parse(cachedModel, "", (gltf) => {
        clearInterval(interval);
        setProgress(100); // Garanta que o progresso seja exatamente 100%
        applyMaterialSettings(gltf);
        scene.current.add(gltf.scene);
        createInitialTag(gltf.scene);
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
            setProgress(100); // Garanta que o progresso seja exatamente 100%
            applyMaterialSettings(gltf);
            scene.current.add(gltf.scene);
            createInitialTag(gltf.scene);
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
    const delta = clock.getDelta(); // Usar clock para obter o delta time
    TWEEN.update();
    controls.current.autoRotateSpeed = 0.3 * (delta / (1 / 60)); // Ajuste a velocidade pela delta time
    controls.current.update(); // Atualizar os controles
    renderer.current.render(scene.current, camera.current);
    labelRenderer.current.render(scene.current, camera.current);
  };

  //<omitido por brevidade>

  return (
    <div className="screen-container">
      {" "}
      {/* Adiciona um container para a tela */}
      <div
        ref={mount}
        className={`scene ${isKioskMode ? "kiosk-mode" : ""}`}
      ></div>
      {isLoading && <LoadingScreen progress={progress} />}
      
      <div className="box-question-response">
        {transcript !== "" ? (
          <Question
            question={transcript}
            showNotification={showQuestionAndResponse}
          />
        ) : null}

        {isResponseLoading && <LoadingResponse onCancel={handleCancel} />}
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
          }}
          isDisabled={isButtonDisabled}
        />
      </div>
      {!isKioskMode && (
        <div className="login-container">
          {!currentUser ? (
            <button onClick={handleLogin} className="login-button">
              <FaSignInAlt color="white" size={20} />
            </button>
          ) : (
            <button onClick={handleLogout} className="login-button">
              <FaSignOutAlt color="white" size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}