import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as TWEEN from "@tweenjs/tween.js";

import LoadingScreen from "../components/LoadingScreen";
import Message from "../components/Message";
import VoiceButton from "../components/VoiceButton";

import { GoHomeFill } from "react-icons/go";

import "../styles/SceneScreen.scss";

export default function SceneScreen() {
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
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controls = useRef(
    new OrbitControls(camera.current, renderer.current.domElement)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");

  // Definindo a posição inicial da câmera
  const initialCameraPosition = { x: 0, y: 20, z: 50 };
  camera.current.position.set(
    initialCameraPosition.x,
    initialCameraPosition.y,
    initialCameraPosition.z
  );

  useEffect(() => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(new THREE.Color("#fff"));
    mount.current.appendChild(renderer.current.domElement);

    controls.current.enableZoom = false;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 0.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);

    const loader = new GLTFLoader();
    const modelRef = ref(storage, "model/cidade_completa_mg.glb");
    getDownloadURL(modelRef)
      .then((url) => {
        loader.load(
          url,
          (gltf) => {
            gltf.scene.traverse((object) => {
              if (object.isMesh) {
                object.material.transparent = true;
                object.material.opacity = 0.5; // Ajuste este valor conforme necessário para mais ou menos transparência
              }
            });
            scene.current.add(gltf.scene);
            setIsLoading(false);
          },
          undefined,
          (error) => console.error("Erro ao carregar o modelo GLB:", error)
        );
      })
      .catch((error) => console.error("Erro ao obter a URL do modelo:", error));

    window.addEventListener("resize", onWindowResize, false);

    animate();

    return () => {
      mount.current.removeChild(renderer.current.domElement);
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

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

  const resetCamera = () => {
    new TWEEN.Tween(camera.current.position)
      .to({ ...initialCameraPosition }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => controls.current.update())
      .start();
  };

  function sendPostRequest(text) {
    console.log("Enviando requisição POST...");
    fetch("https://roko.flowfuse.cloud/talkwithifc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ msg: text }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Resposta recebida via POST:", data);
        processServerCommands(data.comandos);
      })
      .catch((error) => {
        console.error("Erro ao enviar requisição POST:", error);
      });
  }

  function sendText(text) {
    console.log("Enviando mensagem:", text);
    sendPostRequest(text);
  }

  useEffect(() => {
    if (transcript) {
      console.log("Transcrição:", transcript);
      sendText(transcript);
    }
  }, [transcript]);

  const processServerCommands = (commands) => {
    commands.forEach((command) => {
      if (command.texto) {
        setMessage(command.texto);
      }
      if (command.fade) {
        focusOnLocation(command.fade);
      }
      if (command.audio) {
        const audio = new Audio(command.audio);
        audio.play();
        audio.onended = () => setMessage("");
      }
    });
  };

  const focusOnLocation = (targetName) => {
    let targetMesh = null;
    scene.current.traverse((child) => {
      if (
        child.isMesh &&
        child.name.includes(targetName.replace(/\s+/g, "_"))
      ) {
        targetMesh = child;
      }
    });

    if (targetMesh) {
      const targetPosition = new THREE.Vector3();
      targetMesh.getWorldPosition(targetPosition);
      const tween = new TWEEN.Tween(camera.current.position)
        .to(
          {
            x: targetPosition.x,
            y: targetPosition.y + 10,
            z: targetPosition.z + 30,
          },
          2000
        )
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => controls.current.update())
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
    }
  };

  return (
    <div ref={mount} className="scene">
      {isLoading && <LoadingScreen />}
      {message && <Message message={message} />}
      <div className="button-container">
        <button onClick={resetCamera} className="home-button">
          <GoHomeFill color="white" size={20} />
        </button>
        <VoiceButton setTranscript={setTranscript} />
      </div>
    </div>
  );
}
