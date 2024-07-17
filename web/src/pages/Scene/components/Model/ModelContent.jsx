import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import axios from "axios";

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

export default function ModelContent({ glbFileUrl, object, avt, resete, setResete }) {
  const { camera, scene } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [labelObject, setLabelObject] = useState(null);
  const [labelPosition, setLabelPosition] = useState(new THREE.Vector3());
  const [initialPosition] = useState(camera.position.clone());
  const [animationDuration, setAnimationDuration] = useState(2);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const [initialOpacities, setInitialOpacities] = useState({});
  const [initialColors, setInitialColors] = useState({});
  const modelRef = useRef();
  const [cachedModel, setCachedModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const db = await openDB("ModelCache", 1);
        const cached = await getFromDB(db, "models", glbFileUrl);
        if (cached) {
          console.log("Carregando modelo a partir do cache");
          const loader = new THREE.ObjectLoader();
          const model = loader.parse(cached);
          setCachedModel(model);
        } else {
          console.log("Carregando modelo pela primeira vez");
          const loader = new GLTFLoader();
          loader.load(
            glbFileUrl,
            async (gltf) => {
              const model = gltf.scene;
              setCachedModel(model);
              const jsonModel = model.toJSON();
              await saveToDB(db, "models", glbFileUrl, jsonModel);
            },
            undefined,
            (error) => {
              console.error("Error loading model:", error);
            }
          );
        }
      } catch (error) {
        console.error("Error loading model from IndexedDB:", error);
      }
    };

    loadModel();
  }, [glbFileUrl]);

  useEffect(() => {
    if (cachedModel) {
      scene.add(cachedModel);
      return () => {
        scene.remove(cachedModel);
      };
    }
  }, [cachedModel, scene]);

  useEffect(() => {
    const detectObject = async () => {
      try {
        const res = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
          msg: "onde eu estou",
          avt: avt
        });

        if (res.data && res.data.comandos.length > 0) {
          const targetName = res.data.comandos[0].fade;
          const detectedObject = cachedModel.getObjectByName(targetName);
          if (detectedObject) {
            const boundingBox = new THREE.Box3().setFromObject(detectedObject);
            const center = boundingBox.getCenter(new THREE.Vector3());
            setLabelObject(detectedObject);
            setLabelPosition(center);
            setShowLabel(true);
          }
        }
      } catch (error) {
        console.error("Error fetching object location:", error);
      }
    };

    if (cachedModel) {
      detectObject();
    }
  }, [avt, cachedModel]);

  useEffect(() => {
    if (object.length > 0 && cachedModel) {
      const targetName = object[0].fade;
      const fadeObject = cachedModel.getObjectByName(targetName);
      if (fadeObject) {
        const boundingBox = new THREE.Box3().setFromObject(fadeObject);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const aspect = camera.aspect;
        let cameraZ = maxDim / (2 * Math.tan(fov / 2));

        cameraZ = cameraZ / Math.min(1, aspect);

        const newCameraPosition = new THREE.Vector3(
          center.x,
          center.y + cameraZ * 0.5,
          center.z + cameraZ
        );

        setTargetObject({
          fadeObject,
          newCameraPosition,
          center
        });

        setAnimationDuration(object[0].duration + 2);
        setIsAnimating(true);
        setElapsedTime(0);

        const opacities = {};
        cachedModel.traverse(child => {
          if (child.isMesh && child.material) {
            opacities[child.uuid] = child.material.opacity;
          }
        });
        setInitialOpacities(opacities);
      } else {
        console.warn(`Object with name ${targetName} not found in scene`);
      }
    }
  }, [object, cachedModel]);

  useEffect(() => {
    if (resete && cachedModel) {
      camera.position.copy(initialPosition);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      cachedModel.traverse(child => {
        if (child.isMesh && child.material) {
          const initialOpacity = initialOpacities[child.uuid];
          if (initialOpacity !== undefined) {
            child.material.opacity = initialOpacity;
            child.material.transparent = initialOpacity < 1;
          }

          const initialColor = initialColors[child.uuid];
          if (initialColor !== undefined) {
            child.material.color.copy(initialColor);
          }
        }
      });

      setIsAnimating(false);
      setElapsedTime(0);
      setShowLabel(false);
      setResete(false);
    }
  }, [resete, initialPosition, camera, cachedModel, initialOpacities, initialColors, setResete]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.001;
    }

    if (isAnimating && targetObject && cachedModel) {
      const { fadeObject, newCameraPosition, center } = targetObject;
      setElapsedTime(prevTime => prevTime + delta);
      const progress = elapsedTime / animationDuration;

      if (progress < 1) {
        camera.position.lerp(newCameraPosition, 0.1);
        camera.lookAt(center);

        cachedModel.traverse(child => {
          if (child.isMesh && child.material) {
            if (child === fadeObject) {
              child.material.opacity = 1;
            } else {
              child.material.opacity = 0.2;
            }
            child.material.transparent = true;
          }
        });
      } else {
        camera.position.lerp(initialPosition, 0.1);

        if (elapsedTime > animationDuration + 2) {
          setIsAnimating(false);
          setElapsedTime(0);
          cachedModel.traverse(child => {
            if (child.isMesh && child.material) {
              const initialOpacity = initialOpacities[child.uuid];
              if (initialOpacity !== undefined) {
                child.material.opacity = initialOpacity;
                child.material.transparent = initialOpacity < 1;
              }

              const initialColor = initialColors[child.uuid];
              if (initialColor !== undefined) {
                child.material.color.copy(initialColor);
              }
            }
          });
          camera.position.copy(initialPosition);
        }
      }
    }
  });

  return (
    cachedModel ? (
      <primitive object={cachedModel} ref={modelRef}>
        {showLabel && labelObject && (
          <Html position={labelPosition.toArray()} center>
            <div className="label">
              Você está aqui
            </div>
          </Html>
        )}
      </primitive>
    ) : (
      <Html center>
        <div>Loading...</div>
      </Html>
    )
  );
}