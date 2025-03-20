import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import "./LocationLabel.scss";

const LocationLabel = ({ world, modelRef, targetMeshName = "Você_está_aqui" }) => {
  const labelRef = useRef();
  const lineRef = useRef();
  const pulseRef = useRef();
  const targetPositionRef = useRef(null);
  const updateCountRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef(null);

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
    
    // Criar linha que conecta a etiqueta ao ponto - usando curva para melhor visual
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4e50,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    // Inicialmente criamos a linha reta, depois atualizaremos para uma curva
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(60); // Suporte para até 20 pontos na curva
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    world.scene.add(line);
    lineRef.current = line;
    
    // Adicionar efeito de pulse no ponto "Você está aqui"
    const pulseGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4e50,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(center);
    world.scene.add(pulse);
    pulseRef.current = pulse;
    
    // Animação de pulsação
    const animatePulse = () => {
      const scale = { value: 0.5 };
      const opacity = { value: 0.6 };
      
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
            pulseRef.current.material.opacity = 0.6;
            
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
      updateCountRef.current++;
      if (!targetPositionRef.current || !labelRef.current || !lineRef.current) return;
      
      // Converter posição 3D para 2D (coordenadas de tela)
      const tempV = targetPositionRef.current.clone();
      tempV.project(world.camera);
      
      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = ((-tempV.y) * 0.5 + 0.5) * window.innerHeight;
      
      // Calcular a distância da câmera ao ponto
      const distance = targetPositionRef.current.distanceTo(world.camera.position);
      
      // Ajustar a posição da etiqueta baseado na direção da câmera para evitar sobrepor o modelo
      const cameraDir = new THREE.Vector3();
      world.camera.getWorldDirection(cameraDir);
      
      // Vetor do ponto para a câmera
      const toCameraDir = world.camera.position.clone().sub(targetPositionRef.current).normalize();
      
      // Ângulo entre os vetores para determinar o lado da etiqueta
      const dot = cameraDir.dot(toCameraDir);
      
      // Calcular o offset para evitar sobreposição com o modelo
      let xOffset = 0;
      let yOffset = -80; // Padrão acima do ponto
      
      // Ajustar posição baseado no ângulo de visualização
      if (dot < -0.5) {
        // Câmera olhando na direção oposta ao ponto - posicionar mais acima
        yOffset = -150;
      } else if (dot > 0.5) {
        // Câmera olhando na direção do ponto - posicionar ao lado
        xOffset = window.innerWidth * 0.1 * (tempV.x > 0 ? 1 : -1);
        yOffset = -50;
      }
      
      // Posicionar a etiqueta adaptando-se à posição da câmera
      labelRef.current.style.transform = `translate(-50%, -100%) translate(${x + xOffset}px, ${y + yOffset}px)`;
      
      // Ajustar o tamanho da etiqueta baseado na distância da câmera
      const scale = Math.max(0.5, Math.min(1.5, 40 / distance));
      labelRef.current.style.fontSize = `${scale * 1.2}rem`;
      labelRef.current.style.padding = `${scale * 0.5}rem ${scale * 0.8}rem`;
      
      // Criar uma curva de Bezier para a linha conectora
      const startPoint = targetPositionRef.current.clone();
      
      // Converter a posição da etiqueta de 2D para 3D para o ponto final da linha
      const vector = new THREE.Vector3(
        ((x + xOffset) / window.innerWidth) * 2 - 1,
        -(((y + yOffset) / window.innerHeight) * 2 - 1),
        0.5
      );
      vector.unproject(world.camera);
      const dir = vector.sub(world.camera.position).normalize();
      const distanceToLabel = distance * 0.85;
      const endPoint = world.camera.position.clone().add(dir.multiplyScalar(distanceToLabel));
      
      // Ponto de controle para a curva
      const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
      midPoint.y += Math.min(distance * 0.1, 3); // Curva suave para cima
      
      // Criar curva de Bezier quadrática
      const curve = new THREE.QuadraticBezierCurve3(
        startPoint,
        midPoint,
        endPoint
      );
      
      // Atualizar a geometria da linha com a curva
      const points = curve.getPoints(15);
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
          lineRef.current.material.opacity = 0.8;
        } else {
          labelRef.current.classList.add("hidden");
          labelRef.current.classList.remove("visible");
          lineRef.current.material.opacity = 0.2;
        }
      }
    };
    
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
      }
      
      if (pulseRef.current) {
        world.scene.remove(pulseRef.current);
        pulseRef.current.geometry.dispose();
        pulseRef.current.material.dispose();
      }
      
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [world, modelRef, targetMeshName, isVisible]);
  
  return (
    <div 
      ref={labelRef}
      className="location-label hidden"
    >
      <div className="label-content">
        <div className="label-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" fill="currentColor"/>
          </svg>
        </div>
        <span>Você está aqui</span>
      </div>
    </div>
  );
};

export default LocationLabel;