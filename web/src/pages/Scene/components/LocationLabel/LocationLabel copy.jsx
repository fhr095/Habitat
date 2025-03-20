import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import "./LocationLabel.scss";

const LocationLabel = ({ world, modelRef, targetMeshName = "Você_está_aqui" }) => {
  const labelRef = useRef();
  const lineRef = useRef();
  const markerRef = useRef();
  const pulseAnimationRef = useRef(null);
  const targetPositionRef = useRef(null);
  const updateCountRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("LocationLabel: useEffect iniciado.", { world, modelRef, targetMeshName });
    if (!world || !modelRef || !modelRef.current) {
      console.warn("LocationLabel: world ou modelRef não disponíveis.");
      return;
    }
    
    // Procurar a mesh alvo
    let targetMesh = null;
    modelRef.current.traverse((child) => {
      if (child.isMesh && 
          (child.name === targetMeshName || 
           child.name.toLowerCase() === "você_está_aqui" || 
           child.name.toLowerCase() === "voce_esta_aqui")) {
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
    targetPositionRef.current = center;
    
    // Criar marcador visual 3D para "Você está aqui"
    createMarker(center, world.scene);
    
    // Criar linha que conecta a etiqueta ao ponto
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4e50,
      linewidth: 2,
      transparent: true,
      opacity: 0
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([
        center.x, center.y, center.z,
        center.x, center.y + 2, center.z
      ], 3)
    );
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    world.scene.add(line);
    lineRef.current = line;
    
    // Função para animar a entrada da etiqueta
    const animateLabelIn = () => {
      if (!labelRef.current || !lineRef.current) return;
      
      // Animar opacidade da linha
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 0.8 }, 800)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate((obj) => {
          lineRef.current.material.opacity = obj.opacity;
        })
        .start();
      
      // Animar entrada da etiqueta
      if (labelRef.current) {
        labelRef.current.style.opacity = "0";
        labelRef.current.style.transform = "translate(-50%, -130%) scale(0.8)";
        
        setTimeout(() => {
          labelRef.current.style.opacity = "1";
          labelRef.current.style.transform = "translate(-50%, -100%) scale(1)";
          setIsVisible(true);
        }, 200);
      }
    };
    
    // Função para iniciar animação de pulsação do marcador
    const startPulseAnimation = () => {
      stopPulseAnimation();
      
      if (!markerRef.current) return;
      
      const originalScale = new THREE.Vector3(1, 1, 1);
      const pulseAnimation = new TWEEN.Tween({
        scaleX: originalScale.x,
        scaleY: originalScale.y,
        scaleZ: originalScale.z,
        opacity: 0.7
      })
      .to({
        scaleX: originalScale.x * 1.3,
        scaleY: originalScale.y * 1.3,
        scaleZ: originalScale.z * 1.3,
        opacity: 1
      }, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .yoyo(true)
      .repeat(Infinity)
      .onUpdate((obj) => {
        if (markerRef.current) {
          markerRef.current.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
          
          // Atualizar opacidade em todos os materiais do marcador
          markerRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.opacity = obj.opacity;
                });
              } else {
                child.material.opacity = obj.opacity;
              }
            }
          });
        }
      })
      .start();
      
      pulseAnimationRef.current = pulseAnimation;
    };
    
    // Função para parar a animação de pulsação
    const stopPulseAnimation = () => {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
        pulseAnimationRef.current = null;
      }
    };
    
    // Função para atualizar a posição da etiqueta e da linha
    const updateLabelPosition = () => {
      updateCountRef.current++;
      if (!targetPositionRef.current || !labelRef.current || !lineRef.current) return;
      
      // Converter posição 3D para 2D (coordenadas de tela)
      const tempV = targetPositionRef.current.clone();
      tempV.project(world.camera);
      
      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = ((-tempV.y) * 0.5 + 0.5) * window.innerHeight;
      
      // Posicionar a etiqueta um pouco acima do ponto
      labelRef.current.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - 50}px)`;
      
      // Ajustar o tamanho da etiqueta baseado na distância da câmera
      const distance = targetPositionRef.current.distanceTo(world.camera.position);
      const scale = Math.max(0.5, Math.min(1.5, 40 / distance));
      labelRef.current.style.fontSize = `${scale * 1.2}rem`;
      labelRef.current.style.padding = `${scale * 0.5}rem ${scale * 0.8}rem`;
      
      // Atualizar vértices da linha
      const positions = lineRef.current.geometry.attributes.position.array;
      positions[0] = targetPositionRef.current.x;
      positions[1] = targetPositionRef.current.y;
      positions[2] = targetPositionRef.current.z;
      
      // Converter a posição da etiqueta de 2D para 3D para o segundo ponto da linha
      const vector = new THREE.Vector3(
        (x / window.innerWidth) * 2 - 1,
        -((y - 40) / window.innerHeight) * 2 + 1,
        0.5
      );
      vector.unproject(world.camera);
      const dir = vector.sub(world.camera.position).normalize();
      const distanceToLabel = distance * 0.85;
      const targetLabelPosition = world.camera.position.clone().add(dir.multiplyScalar(distanceToLabel));
      
      positions[3] = targetLabelPosition.x;
      positions[4] = targetLabelPosition.y;
      positions[5] = targetLabelPosition.z;
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Verificar visibilidade
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
      
      const shouldBeVisible = isInView && isInFront;
      
      // Atualizar visibilidade da etiqueta de forma suave
      if (shouldBeVisible && !isVisible) {
        animateLabelIn();
        startPulseAnimation();
      } else if (!shouldBeVisible && isVisible) {
        if (labelRef.current) {
          labelRef.current.style.opacity = "0";
          setIsVisible(false);
        }
        
        if (lineRef.current) {
          new TWEEN.Tween({ opacity: lineRef.current.material.opacity })
            .to({ opacity: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((obj) => {
              lineRef.current.material.opacity = obj.opacity;
            })
            .start();
        }
        
        stopPulseAnimation();
      }
    };
    
    // Iniciar loop de animação
    const renderLoop = () => {
      updateLabelPosition();
      requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
    
    // Detectar cliques na etiqueta para animar o marcador
    const handleLabelClick = () => {
      if (markerRef.current) {
        // Efeito de destaque ao clicar
        new TWEEN.Tween({ 
          scaleX: markerRef.current.scale.x,
          scaleY: markerRef.current.scale.y,
          scaleZ: markerRef.current.scale.z
        })
        .to({ 
          scaleX: 1.5,
          scaleY: 1.5, 
          scaleZ: 1.5
        }, 300)
        .easing(TWEEN.Easing.Back.Out)
        .yoyo(true)
        .repeat(1)
        .onComplete(() => {
          startPulseAnimation();
        })
        .start();
        
        // Criar efeito de onda
        createRippleEffect(targetPositionRef.current, world.scene);
      }
    };
    
    if (labelRef.current) {
      labelRef.current.addEventListener('click', handleLabelClick);
    }
    
    // Limpar recursos ao desmontar
    return () => {
      if (lineRef.current) {
        world.scene.remove(lineRef.current);
        lineRef.current.geometry.dispose();
        lineRef.current.material.dispose();
      }
      
      if (markerRef.current) {
        world.scene.remove(markerRef.current);
        markerRef.current.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
      
      if (labelRef.current) {
        labelRef.current.removeEventListener('click', handleLabelClick);
      }
      
      stopPulseAnimation();
    };
  }, [world, modelRef, targetMeshName]);
  
  // Função para criar o marcador 3D "Você está aqui"
  const createMarker = (position, scene) => {
    // Criar grupo para o marcador
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(position);
    markerGroup.position.y += 0.5; // Levantar um pouco do chão
    
    // Criar base do marcador (cilindro)
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4e50,
      transparent: true,
      opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0;
    markerGroup.add(base);
    
    // Criar pino central
    const pinGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
    const pinMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4e50,
      transparent: true,
      opacity: 0.9
    });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.y = 0.45;
    markerGroup.add(pin);
    
    // Adicionar luz para destacar o marcador
    const light = new THREE.PointLight(0xff4e50, 1, 5);
    light.position.y = 1;
    markerGroup.add(light);
    
    // Adicionar halo (anel)
    const ringGeometry = new THREE.RingGeometry(0.6, 0.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4e50,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    markerGroup.add(ring);
    
    scene.add(markerGroup);
    markerRef.current = markerGroup;
    
    // Iniciar com escala pequena e animar para o tamanho normal
    markerGroup.scale.set(0.1, 0.1, 0.1);
    new TWEEN.Tween({
      scaleX: 0.1,
      scaleY: 0.1,
      scaleZ: 0.1
    })
    .to({
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1
    }, 1000)
    .easing(TWEEN.Easing.Elastic.Out)
    .onUpdate((obj) => {
      markerGroup.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
    })
    .start();
  };
  
  // Função para criar efeito de ondas ao redor do marcador
  const createRippleEffect = (position, scene) => {
    // Geometria do anel para o efeito de ondas
    const rippleGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4e50,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    // Criar mesh para o efeito
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.copy(position);
    ripple.position.y += 0.1;
    ripple.rotation.x = Math.PI / 2;
    scene.add(ripple);
    
    // Animar o efeito de ondas
    new TWEEN.Tween({
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      opacity: 0.8
    })
    .to({
      scaleX: 5,
      scaleY: 5,
      scaleZ: 1,
      opacity: 0
    }, 1500)
    .easing(TWEEN.Easing.Circular.Out)
    .onUpdate((obj) => {
      ripple.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
      rippleMaterial.opacity = obj.opacity;
    })
    .onComplete(() => {
      scene.remove(ripple);
      rippleGeometry.dispose();
      rippleMaterial.dispose();
    })
    .start();
  };
  
  return (
    <div 
      ref={labelRef}
      className={`location-label ${isVisible ? 'visible' : 'hidden'}`}
    >
      <div className="label-content">
        <span>Você está aqui</span>
      </div>
    </div>
  );
};

export default LocationLabel;