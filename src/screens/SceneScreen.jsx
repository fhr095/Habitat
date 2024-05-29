import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import * as TWEEN from '@tweenjs/tween.js';
import LoadingScreen from '../components/LoadingScreen';
import ChatContainer from '../components/ChatContainer';
import Question from '../components/Question';
import Response from '../components/Response';
import VoiceButton from '../components/VoiceButton';
import { GoHomeFill } from 'react-icons/go';
import '../styles/SceneScreen.scss';

const openDB = (name, version) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models');
      }
    };
  });
};

const getFromDB = (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const saveToDB = (db, storeName, key, value) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
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
  const modelGroup = useRef(new THREE.Group());
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: '' });

  useEffect(() => {
    camera.current.position.set(0, 20, 50);
    setupScene();
    loadModel();
    window.addEventListener('resize', onWindowResize);
    const animateLoop = requestAnimationFrame(animate);

    return () => {
      if (mount.current && renderer.current.domElement.parentNode === mount.current) {
        mount.current.removeChild(renderer.current.domElement);
      }
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animateLoop);
      disposeResources();
    };
  }, []);

  const setupScene = () => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(new THREE.Color('#fff'));
    mount.current.appendChild(renderer.current.domElement);

    controls.current.enableZoom = true;
    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.05;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 0.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);

    scene.current.add(modelGroup.current);

    // Adicionar a esfera ao centro do modelGroup
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    modelGroup.current.add(sphere);
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
    const modelRef = ref(storage, 'model/cidade_completa_mg.glb');

    const db = await openDB('ModelCache', 1);

    const cachedModel = await getFromDB(db, 'models', 'cidade_completa_mg');
    if (cachedModel) {
      console.log('Carregando modelo a partir do cache');
      loader.parse(cachedModel, '', (gltf) => {
        applyMaterialSettings(gltf);
        centerModel(gltf.scene);
        modelGroup.current.add(gltf.scene);
        setIsLoading(false);
        updateOrbitControls();
      });
    } else {
      console.log('Carregando modelo a partir do Firebase Storage');
      getDownloadURL(modelRef).then((url) => {
        fetch(url).then(response => response.arrayBuffer()).then(arrayBuffer => {
          loader.parse(arrayBuffer, '', (gltf) => {
            applyMaterialSettings(gltf);
            centerModel(gltf.scene);
            modelGroup.current.add(gltf.scene);
            setIsLoading(false);
            saveToDB(db, 'models', 'cidade_completa_mg', arrayBuffer);
            updateOrbitControls();
          });
        });
      }).catch((error) => {
        console.error('Erro ao carregar modelo GLB:', error);
      });
    }
  };

  const centerModel = (model) => {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center); // Move the model to its center
    modelGroup.current.position.copy(center); // Move the model group to the center
  };

  const updateOrbitControls = () => {
    controls.current.target.copy(modelGroup.current.position);
    controls.current.update();
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
            child.material.opacity = 0.5;
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
          }, 5000);
        })
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
    }
  };

  const sendPostRequest = (text) => {
    console.log("Sending POST request...");
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
      <ChatContainer
        isOpen={chatOpen}
        onSearch={setSearchTerm}
        feedbackFilter={feedbackFilter}
        setFeedbackFilter={setFeedbackFilter}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        setChatOpen={setChatOpen}
      />
      {transcript !== "" ? <Question question={transcript} /> : null}
      {response.length > 0 && <Response iaResponse={response} question={transcript} focusOnLocation={focusOnLocation} />}
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
        <button onClick={() => { modelGroup.current.position.x -= 10; updateOrbitControls(); }} className="move-left-button">
          Move Left
        </button>
      </div>
    </div>
  );
}
