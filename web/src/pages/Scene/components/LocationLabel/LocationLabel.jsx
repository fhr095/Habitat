import React, { useEffect, useRef, useState, forwardRef } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import "./LocationLabel.scss";

// Ícone SVG para o marcador de localização
const LocationIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="location-icon"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
  </svg>
);

const LocationLabel = forwardRef(({ world, modelRef, targetMeshName = "Você_está_aqui" }, ref) => {
  const labelRef = useRef();
  const lineRef = useRef();
  const pulseRef = useRef();
  const targetPositionRef = useRef(null);
  const updateCountRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef(null);
  const prevEndPointRef = useRef(null);
  const labelSizeRef = useRef({ width: 0, height: 0 });

  // Expor a referência interna para o componente pai através do forwardRef
  React.useImperativeHandle(ref, () => labelRef.current);

  // Configurações de cor e estilo consistentes com o design system
  const COLOR_PRIMARY = 0xFF7D45; // Cor primária para linha e pulse
  const PULSE_OPACITY = 0.6;
  const LINE_OPACITY = 0.8;

  useEffect(() => {
    console.log("LocationLabel: useEffect iniciado.", { world, modelRef, targetMeshName });
    if (!world || !modelRef || !modelRef.current) {
      console.warn("LocationLabel: world ou modelRef não disponíveis.");
      return;
    }
    
    // Procurar a mesh alvo
    let targetMesh = null;
    modelRef.current.traverse((child) => {
      if (child.isMesh && child.name === targetMeshName) {
        targetMesh = child;
        console.log("LocationLabel: Mesh alvo encontrada:", child.name);
      }
    });
    
    if (!targetMesh) {
      console.warn(`LocationLabel: Mesh "${targetMeshName}" não encontrada no modelo.`);
      return;
    }
    
    // Calcular posição central da mesh
    targetMesh.geometry.computeBoundingBox();
    const boundingBox = targetMesh.geometry.boundingBox;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    targetMesh.localToWorld(center);
    console.log("LocationLabel: Centro calculado (mundo):", center);
    targetPositionRef.current = center;
    
    // Criar linha que conecta a etiqueta ao ponto
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: COLOR_PRIMARY,
      linewidth: 2,
      transparent: true,
      opacity: LINE_OPACITY,
      depthTest: false
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(60);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.renderOrder = 999;
    world.scene.add(line);
    lineRef.current = line;
    
    // Adicionar efeito de pulse no ponto "Você está aqui"
    const pulseGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_PRIMARY,
      transparent: true,
      opacity: PULSE_OPACITY,
      depthWrite: false,
      depthTest: false
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(center);
    pulse.renderOrder = 1000;
    world.scene.add(pulse);
    pulseRef.current = pulse;
    
    // Inicializar o tamanho do rótulo
    if (labelRef.current) {
      labelSizeRef.current = {
        width: labelRef.current.offsetWidth,
        height: labelRef.current.offsetHeight
      };
    }
    
    // Animação de pulsação
    const animatePulse = () => {
      const scale = { value: 0.5 };
      const opacity = { value: PULSE_OPACITY };
      
      new TWEEN.Tween(scale)
        .to({ value: 1.2 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (pulseRef.current) {
            pulseRef.current.scale.set(scale.value, scale.value, scale.value);
          }
        })
        .start();
        
      new TWEEN.Tween(opacity)
        .to({ value: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (pulseRef.current && pulseRef.current.material) {
            pulseRef.current.material.opacity = opacity.value;
          }
        })
        .onComplete(() => {
          if (pulseRef.current) {
            pulseRef.current.scale.set(0.5, 0.5, 0.5);
            pulseRef.current.material.opacity = PULSE_OPACITY;
            
            // Repetir a animação
            animationRef.current = setTimeout(animatePulse, 500);
          }
        })
        .start();
    };
    
    // Iniciar animação de pulsação
    animatePulse();
    
    // Função para atualizar a posição da etiqueta e da linha
    const updateLabelPosition = () => {
      if (!targetPositionRef.current || !labelRef.current || !lineRef.current) return;
      
      updateCountRef.current++;
      
      // Atualiza as dimensões do rótulo se elas mudaram
      if (labelRef.current.offsetWidth !== labelSizeRef.current.width ||
          labelRef.current.offsetHeight !== labelSizeRef.current.height) {
        labelSizeRef.current = {
          width: labelRef.current.offsetWidth,
          height: labelRef.current.offsetHeight
        };
      }
      
      // Converter posição 3D para 2D (coordenadas de tela)
      const tempV = targetPositionRef.current.clone();
      tempV.project(world.camera);
      
      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = ((-tempV.y) * 0.5 + 0.5) * window.innerHeight;
      
      // Calcular a distância da câmera ao ponto
      const distance = targetPositionRef.current.distanceTo(world.camera.position);
      
      // Ajustar a posição da etiqueta baseado na direção da câmera
      const cameraDir = new THREE.Vector3();
      world.camera.getWorldDirection(cameraDir);
      
      // Vetor do ponto para a câmera
      const toCameraDir = world.camera.position.clone().sub(targetPositionRef.current).normalize();
      
      // Ângulo entre os vetores para determinar o lado da etiqueta
      const dot = cameraDir.dot(toCameraDir);
      
      // Calcular o offset para evitar sobreposição com o modelo
      let xOffset = 0;
      let yOffset = -80;
      
      // Ajustar posição baseado no ângulo de visualização
      if (dot < -0.5) {
        yOffset = -Math.max(150, labelSizeRef.current.height + 20);
      } else if (dot > 0.5) {
        const sideOffset = Math.max(labelSizeRef.current.width * 0.6, window.innerWidth * 0.05);
        xOffset = sideOffset * (tempV.x > 0 ? 1 : -1);
        yOffset = -Math.max(50, labelSizeRef.current.height * 0.6);
      }
      
      // Calcular posição final da etiqueta
      const finalX = x + xOffset;
      const finalY = y + yOffset;
      
      // Ajustar para garantir que a etiqueta não saia da tela
      const safeX = Math.min(Math.max(finalX, labelSizeRef.current.width * 0.5), window.innerWidth - labelSizeRef.current.width * 0.5);
      const safeY = Math.min(Math.max(finalY, labelSizeRef.current.height), window.innerHeight - 20);
      
      // Posicionar a etiqueta
      labelRef.current.style.transform = `translate(-50%, -100%) translate(${safeX}px, ${safeY}px)`;
      
      // Ajustar o tamanho da etiqueta baseado na distância da câmera
      const scale = Math.max(0.8, Math.min(1.2, 40 / distance));
      labelRef.current.style.fontSize = `${scale}rem`;
      labelRef.current.style.padding = `${scale * 0.5}rem ${scale * 0.8}rem`;
      
      // Criar uma curva de Bezier para a linha conectora
      const startPoint = targetPositionRef.current.clone();
      
      // Converter a posição da etiqueta de 2D para 3D para o ponto final da linha
      const vector = new THREE.Vector3(
        ((safeX) / window.innerWidth) * 2 - 1,
        -(((safeY) / window.innerHeight) * 2 - 1),
        0.5
      );
      vector.unproject(world.camera);
      const dir = vector.sub(world.camera.position).normalize();
      const distanceToLabel = distance * 0.85;
      const endPoint = world.camera.position.clone().add(dir.multiplyScalar(distanceToLabel));
      
      // Usar interpolação suave para o ponto final
      let finalEndPoint = endPoint;
      if (prevEndPointRef.current) {
        finalEndPoint = prevEndPointRef.current.clone().lerp(endPoint, 0.1);
      }
      prevEndPointRef.current = finalEndPoint.clone();
      
      // Ponto de controle para a curva - mais próximo do ponto alvo para um arco natural
      const midPoint = new THREE.Vector3().addVectors(startPoint, finalEndPoint).multiplyScalar(0.5);
      // Ajustar curva 
      const heightFactor = Math.min(distance * 0.05, 2.5);
      midPoint.y += heightFactor; 
      
      // Criar curva de Bezier quadrática
      const curve = new THREE.QuadraticBezierCurve3(
        startPoint,
        midPoint,
        finalEndPoint
      );
      
      // Atualizar a geometria da linha com a curva
      const points = curve.getPoints(18);
      const linePositions = lineRef.current.geometry.attributes.position.array;
      for (let i = 0; i < points.length; i++) {
        const idx = i * 3;
        if (idx + 2 < linePositions.length) {
          linePositions[idx] = points[i].x;
          linePositions[idx + 1] = points[i].y;
          linePositions[idx + 2] = points[i].z;
        }
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      lineRef.current.geometry.setDrawRange(0, points.length);
      
      // Atualizar TWEEN para animações suaves
      TWEEN.update();
      
      // Verificar se o alvo está visível na cena
      const frustum = new THREE.Frustum();
      const matrix = new THREE.Matrix4().multiplyMatrices(
        world.camera.projectionMatrix, 
        world.camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(matrix);
      const isInView = frustum.containsPoint(targetPositionRef.current);
      
      // Verificar se o alvo está à frente da câmera
      const dirFromCamera = new THREE.Vector3().subVectors(targetPositionRef.current, world.camera.position);
      const isInFront = dirFromCamera.dot(world.camera.getWorldDirection(new THREE.Vector3())) > 0;
      
      // Atualizar visibilidade
      const shouldBeVisible = isInView && isInFront;
      if (shouldBeVisible !== isVisible) {
        setIsVisible(shouldBeVisible);
        if (shouldBeVisible) {
          labelRef.current.classList.add("visible");
          labelRef.current.classList.remove("hidden");
          lineRef.current.material.opacity = LINE_OPACITY;
        } else {
          labelRef.current.classList.add("hidden");
          labelRef.current.classList.remove("visible");
          lineRef.current.material.opacity = 0.2;
        }
      }
    };
    
    // Usar requestAnimationFrame para animação suave
    const renderLoop = () => {
      updateLabelPosition();
      requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
    
    // Limpar recursos ao desmontar
    return () => {
      if (lineRef.current) {
        world.scene.remove(lineRef.current);
        lineRef.current.geometry.dispose();
        lineRef.current.material.dispose();
        lineRef.current = null;
      }
      
      if (pulseRef.current) {
        world.scene.remove(pulseRef.current);
        pulseRef.current.geometry.dispose();
        pulseRef.current.material.dispose();
        pulseRef.current = null;
      }
      
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      
      prevEndPointRef.current = null;
    };
  }, [world, modelRef, targetMeshName]);
  
  return (
    <div 
      ref={labelRef}
      className="location-label hidden"
    >
      <div className="label-content">
        <LocationIcon />
        <span>Você está aqui</span>
      </div>
    </div>
  );
});

export default LocationLabel;