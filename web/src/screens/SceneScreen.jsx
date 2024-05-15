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
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controls = useRef(new OrbitControls(camera.current, renderer.current.domElement));
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");

  // Configure the initial camera position only once on mount
  useEffect(() => {
    camera.current.position.set(0, 20, 50);
    setupScene();
    loadModel();
    window.addEventListener("resize", onWindowResize);
    const animateLoop = animate();  // Start the animation loop

    return () => {
      mount.current.removeChild(renderer.current.domElement);
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop); // Cancel the animation frame request when component unmounts
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

  const loadModel = () => {
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

  const resetCamera = () => {
    new TWEEN.Tween(camera.current.position)
      .to({ x: 0, y: 20, z: 50 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => controls.current.update())
      .start();
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

  const focusOnLocation = (targetName) => {
    let targetMesh = null;
    scene.current.traverse((child) => {
      if (child.isMesh && child.name.includes(targetName.replace(/\s+/g, "_"))) {
        targetMesh = child;
        if (targetMesh) {
          targetMesh.material.opacity = 1; // Set opacity to fully opaque when focused
        }
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
          const tweenOpacity = new TWEEN.Tween(targetMesh.material)
            .to({ opacity: 0.5 }, 3000) // Adjust the duration as needed
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
    }
  };

  return (
    <div ref={mount} className="scene">
      {isLoading && <LoadingScreen />}
      {message && <Message iaMessage={message} question={transcript} />}
      <div className="button-container">
        <button onClick={resetCamera} className="home-button">
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
