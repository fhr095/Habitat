import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ref, getDownloadURL } from "firebase/storage"; // Comentado para o carregamento local
import { storage } from "../firebase"; // Comentado para o carregamento local
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import Chat from "../components/Chat";
import Message from "../components/Message";
import VoiceButton from "../components/VoiceButton";

import { GoHomeFill, GoDiscussionClosed } from "react-icons/go";

import "../styles/SceneScreen.scss";

export default function SceneScreen({ isKioskMode }) {
  const mount = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controls = useRef(new OrbitControls(camera.current, renderer.current.domElement));
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");

  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    camera.current.position.set(0, 20, 50);
    setupScene();
    loadModelFromFirebase(); // Comentado para o carregamento local
    //loadLocalModel();
    window.addEventListener("resize", onWindowResize);
    const animateLoop = animate();

    return () => {
      mount.current.removeChild(renderer.current.domElement);
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop);
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

  /*const loadLocalModel = () => {
    const loader = new GLTFLoader();
    const modelUrl = '/model/cidade_completa_mg.glb'; // Caminho do arquivo no diretório public
    loader.load(modelUrl, (gltf) => {
      gltf.scene.traverse((object) => {
        if (object.isMesh) {
          object.material.transparent = true;
          object.material.opacity = 0.5;
        }
      });
      scene.current.add(gltf.scene);
      setIsLoading(false);
    }, undefined, (error) => {
      console.error("Erro ao carregar o modelo GLB:", error);
    });
  };*/

  
  const loadModelFromFirebase = () => {
    const loader = new GLTFLoader();
    const modelRef = ref(storage, "model/cidade_completa_mg.glb");
    getDownloadURL(modelRef).then((url) => {
      loader.load(url, (gltf) => {
        gltf.scene.traverse((object) => {
          if (object.isMesh) {
            object.material.transparent = true;
            object.material.opacity = 0.5;
          }
        });
        scene.current.add(gltf.scene);
        setIsLoading(false);
      }, undefined, (error) => {
        console.error("Erro ao carregar o modelo GLB:", error);
      });
    });
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
            child.material.opacity = 0.5; // Reseta a opacidade dos objetos
          }
        });
      })
      .start();
  };

  const focusOnLocation = (targetName) => {
    let targetMesh = null;
    scene.current.traverse((child) => {
      if (child.isMesh && child.name.includes(targetName.replace(/\s+/g, "_"))) {
        console.log(`Target mesh found: ${child.name}`); // Log do objeto encontrado
        targetMesh = child;
        targetMesh.material = targetMesh.material.clone(); // Clona o material para evitar conflitos
        targetMesh.material.opacity = 1; // Torna o objeto alvo opaco
      } else if (child.isMesh) {
        child.material = child.material.clone(); // Clona o material para evitar conflitos
        child.material.opacity = 0.05; // Torna o restante da cena transparente
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
          }, 5000); // Reseta após 5 segundos
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
    }
  };

  const sendPostRequest = (text) => {
    console.log("Enviando requisição POST...");
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
      const command = commands[0];
      if (command.texto) {
        setMessage(command.texto);
      }
      if (command.fade) {
        focusOnLocation(command.fade);
      }
      if (command.audio) {
        const audio = new Audio(command.audio);
        audio.play();
        audio.onended = () => {
          setMessage("");
        };
      }
    }
  };

  return (
    <div ref={mount} className={`scene ${isKioskMode ? 'kiosk-mode' : ''}`}>
      {isLoading && <LoadingScreen />}
      {!isKioskMode && (
        <button className='chat-button' style={chatOpen ? {right: "50%"} : {right:"0"}} onClick={() => setChatOpen(!chatOpen)}>
          <GoDiscussionClosed color="white" size={20} />
        </button>
      )}
      {chatOpen && <Chat isOpen={chatOpen} />}
      {message && <Message iaMessage={message} question={transcript} />}
      <div className="button-container">
        <button onClick={resetCameraAndTransparency} className="home-button">
          <GoHomeFill color="white" size={20} />
        </button>
        <VoiceButton
          setTranscript={(newTranscript) => {
            console.log("Transcript:", newTranscript);
            setTranscript(newTranscript);
            sendPostRequest(newTranscript);
          }}
        />
      </div>
    </div>
  );
}
