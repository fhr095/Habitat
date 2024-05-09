import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import * as TWEEN from '@tweenjs/tween.js';
import LoadingScreen from '../components/LoadingScreen';
import Message from '../components/Message';
import VoiceButton from '../components/VoiceButton';
import '../styles/SceneScreen.css';

export default function SceneScreen() {
  const mount = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controls = useRef(new OrbitControls(camera.current, renderer.current.domElement));
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [locationData, setLocationData] = useState('');

  useEffect(() => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(new THREE.Color('#008080')); // Dark green
    mount.current.appendChild(renderer.current.domElement);

    camera.current.position.set(0, 20, 50);
    controls.current.enableZoom = false;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 0.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);

    const loader = new GLTFLoader();
    const modelRef = ref(storage, 'model/cidade_completa_mg.glb');
    getDownloadURL(modelRef).then(url => {
      loader.load(url, gltf => {
          scene.current.add(gltf.scene);
          setIsLoading(false);
        }, undefined, error => console.error("Error loading GLB model:", error));
    }).catch(error => console.error("Error fetching model URL:", error));

    window.addEventListener('resize', onWindowResize, false);

    return () => {
      mount.current.removeChild(renderer.current.domElement);
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  const postData = (data) => {
    fetch('https://your-endpoint.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
      setMessage(data.message);
      if (data.fade) {
        focusOnLocation(data.fade);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  const focusOnLocation = (targetName) => {
    let targetMesh = null;
    scene.current.traverse(child => {
      if (child.isMesh && child.name.includes(targetName.replace(/\s+/g, '_'))) {
        targetMesh = child;
      }
    });

    if (targetMesh) {
      const targetPosition = new THREE.Vector3();
      targetMesh.getWorldPosition(targetPosition);
      const tween = new TWEEN.Tween(camera.current.position)
        .to({
          x: targetPosition.x,
          y: targetPosition.y + 10,
          z: targetPosition.z + 30
        }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => controls.current.update())
        .start();
    } else {
      console.error("Target mesh not found:", targetName);
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

  useEffect(() => {
    animate();
  }, []);

  return (
    <div ref={mount} className="scene">
      {isLoading && <LoadingScreen />}
      {message && <Message message={message} />}
      <VoiceButton setTranscript={(transcript) => {
        console.log("Voice transcript received:", transcript);
        postData({ text: transcript });
      }} />
    </div>
  );
}