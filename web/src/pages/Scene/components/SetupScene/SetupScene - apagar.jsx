import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components"; // Assumindo que os componentes OBC são usados

export default function SetupScene({ setCamera, modelUrl, options = {}, setComponents, setWorld }) {
  // Controle mínimo para evitar recarregamentos contínuos
  const minimalSetup = false;  // Mude para true se quiser o modo de configuração mínima para depuração

  const {
    backgroundColor = "#eeeeee",
    cameraType = "perspective",
    cameraPosition = { x: 10, y: 20, z: 50 },
    cameraDirection = { x: 0, y: 0, z: 0 },
    autoRotate = false,
    autoRotateSpeed = 2.0,
    zoomEnabled = true,
    movementLimits = null,
    pixelRatio = 1.5,
    lightType = "ambient",
    lightIntensity = 0.5,
    lightPosition = { x: 0, y: 20, z: 10 },
    lightQuantity = 1,
    transparencyEnabled = false,
    materialOpacity = 1.0,
    shadowsEnabled = false,
    shadowIntensity = 1.0,
    antiAliasingEnabled = true,
    ambientOcclusionEnabled = false,
    lodEnabled = false,
    lodDistance = 1000,
    animationSmoothness = 1.0
  } = options;

  const cameraRef = useRef(null);
  const worldRef = useRef(null);
  const containerRef = useRef(null); // Referência para o container da cena

  useEffect(() => {
    // Inicializa a cena e o renderizador
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(minimalSetup ? 0xeeeeee : backgroundColor);

    const renderer = new THREE.WebGLRenderer({
      antialias: minimalSetup ? false : antiAliasingEnabled,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(minimalSetup ? 1 : pixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Inicializa os componentes OBC
    const components = new OBC.Components();  
    setComponents(components);  // Atualiza os componentes no estado de Scene

    // Configuração da câmera
    let camera;
    if (cameraType === "perspective") {
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    } else {
      camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
    }
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);

    // Configuração dos controles da câmera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = minimalSetup ? false : autoRotate;
    controls.autoRotateSpeed = minimalSetup ? 0 : autoRotateSpeed;
    controls.enableZoom = minimalSetup ? true : zoomEnabled;

    // Limites de movimento, se houver
    if (movementLimits && !minimalSetup) {
      controls.minPolarAngle = movementLimits.y[0];
      controls.maxPolarAngle = movementLimits.y[1];
    }

    // Configuração de luzes
    for (let i = 0; i < lightQuantity; i++) {
      let light;
      if (lightType === "ambient") {
        light = new THREE.AmbientLight(0xffffff, lightIntensity);
      } else if (lightType === "directional") {
        light = new THREE.DirectionalLight(0xffffff, lightIntensity);
        light.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
        if (shadowsEnabled) {
          light.castShadow = true;
          light.shadow.intensity = shadowIntensity;
        }
      }
      scene.add(light);
    }

    // Configurações de transparência
    if (!minimalSetup && transparencyEnabled) {
      scene.traverse((object) => {
        if (object.isMesh) {
          object.material.transparent = true;
          object.material.opacity = materialOpacity;
        }
      });
    }

    // Configuração de LOD e Ambient Occlusion
    if (!minimalSetup && lodEnabled) {
      const lod = new THREE.LOD();
      scene.add(lod);
      scene.traverse((object) => {
        if (object.isMesh) {
          lod.addLevel(object, lodDistance);
        }
      });
    }

    if (!minimalSetup && ambientOcclusionEnabled) {
      const aoMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
      scene.traverse((object) => {
        if (object.isMesh) {
          object.material = aoMaterial;  // Aplica Ambient Occlusion simples
        }
      });
    }

    // Configuração da animação
    const animate = () => {
      if (!minimalSetup && animationSmoothness) {
        requestAnimationFrame(animate);
        TWEEN.update();
        controls.update();
        renderer.render(scene, camera);
      }
    };

    // Inicializa a animação
    animate();

    // Responsividade: Ajuste de tamanho da janela
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Atualiza referências de câmera e mundo no estado
    if (!cameraRef.current) {
      setCamera(camera);
      cameraRef.current = camera;
    }

    if (!worldRef.current) {
      setWorld({ scene, renderer, camera, controls });
      worldRef.current = { scene, renderer, camera, controls };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement); // Limpa o renderer quando o componente é desmontado
    };
  }, [
    //cameraPosition,
    //cameraDirection,
    //autoRotate,
    //autoRotateSpeed,
    //zoomEnabled,
    //pixelRatio,
    //backgroundColor,
    //lightType,
    //lightIntensity,
    //lightPosition,
    //lightQuantity,
    //transparencyEnabled,
    //materialOpacity,
   // shadowsEnabled,
    //shadowIntensity,
    //antiAliasingEnabled,
    //ambientOcclusionEnabled,
    //lodEnabled,
    //lodDistance,
    //animationSmoothness
  ]); // Executa apenas na montagem inicial do componente

  return <div ref={containerRef} className="scene-container"></div>;
}
