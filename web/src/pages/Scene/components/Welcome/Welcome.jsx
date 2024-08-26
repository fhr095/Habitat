import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import axios from "axios";
import "./Welcome.scss";

// Componente para carregar e animar o modelo GLB
const AnimatedModel = ({ url }) => {
  const [gltf, setGltf] = useState(null);
  const mixer = useRef(null);
  const modelRef = useRef();

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      setGltf(gltf);
    });
  }, [url]);

  useEffect(() => {
    if (gltf && gltf.animations.length) {
      mixer.current = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => {
        const action = mixer.current.clipAction(clip);
        action.play();
      });
    }
  }, [gltf]);

  useFrame((state, delta) => {
    mixer.current?.update(delta);
    if (modelRef.current) {
      modelRef.current.rotation.y = -1.55; // Rotaciona o modelo 180 graus para deixá-lo de frente
      modelRef.current.position.y = -0.75; // Ajuste a posição Y para mover o modelo para baixo
    }
  });

  return gltf ? <primitive object={gltf.scene} ref={modelRef} /> : null;
};

// Componente principal da cena
export default function Welcome({
  isPersonDetected,
  history,
  transcripts,
  avt,
  persons,
  isFinished,
}) {
  const [currentModel, setCurrentModel] = useState("/Avatar/chegando.glb");
  const [isCooldown, setIsCooldown] = useState(false);

  // Ref for the audio element
  const audioRef = useRef(null);

  useEffect(() => {
    if (isPersonDetected) {
      setCurrentModel("/Avatar/acenando.glb");
      isFinished(true);  // Bloqueia fala enquanto o robô aparece
    } else {
      const timer = setTimeout(() => {
        setCurrentModel("/Avatar/conversando-feliz.glb");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPersonDetected, isFinished]);

  // Novo efeito para fazer o POST se persons contiver dados e não estiver em cooldown
  useEffect(() => {
    if (isPersonDetected && persons.length > 0 && !isCooldown && history.length == 0) {
      const postData = async () => {
        try {
          const res = await axios.post(
            "https://roko.flowfuse.cloud/talkwithifc",
            {
              avt: avt,
              persons: persons,
            }
          );
          // Play the audio when response is received
          if (res.data.comandos && res.data.comandos.audio) {
            audioRef.current.src = res.data.comandos.audio;
            audioRef.current.play();
          }
        } catch (error) {
          console.error("Error sending data:", error);
        }
      };

      // Inicia o cooldown de 5 minutos após o envio dos dados
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, 300000); // 5 minutos

      postData();
    }
  }, [isPersonDetected, persons, avt, isCooldown, history]);

  // Set isFinished to false when audio ends
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.onended = () => {
        isFinished(false);  // Libera fala após o áudio terminar
      };
    }
  }, [isFinished]);

  useEffect(() => {
    if (history.length == 0) {
      isFinished(false);  // Libera fala quando o histórico é limpo
    }
  }, [history]);

  const containerClass =
  history.length > 0 || transcripts !== "" ? "welcome-container minimized" : "welcome-container";

  return (
    <div className={containerClass}>
      <Canvas camera={{ position: [0, 0.2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedModel url={currentModel} />
        <OrbitControls />
      </Canvas>
      {/* Audio element to play the audio */}
      <audio ref={audioRef} />
    </div>
  );
}
