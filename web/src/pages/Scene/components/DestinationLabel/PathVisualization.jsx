import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

/**
 * Componente para visualizar caminho entre a localização atual e o destino
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.scene - A cena THREE.js
 * @param {THREE.Vector3} props.originPosition - Posição de origem (localização atual)
 * @param {THREE.Vector3} props.destinationPosition - Posição de destino
 * @param {boolean} props.isActive - Se o caminho deve estar ativo
 * @param {number} props.color - Cor do caminho
 * @param {number} props.pathType - Tipo de caminho: 0 = linha, 1 = linha pontilhada, 2 = setas
 */
const PathVisualization = ({ 
  scene, 
  originPosition, 
  destinationPosition, 
  isActive = false, 
  color = 0xFF7D45,
  pathType = 2
}) => {
  // Referências para elementos 3D
  const pathRef = useRef(null);
  const arrowsRef = useRef([]);
  const animationRef = useRef(null);
  
  // Constantes
  const PATH_OPACITY = 0.7;
  const ARROW_SIZE = 0.5;
  const NUM_ARROWS = 5; // Número de setas ao longo do caminho
  
  // Limpar objetos da cena
  const cleanupObjects = () => {
    if (pathRef.current) {
      scene.remove(pathRef.current);
      if (pathRef.current.geometry) pathRef.current.geometry.dispose();
      if (pathRef.current.material) pathRef.current.material.dispose();
      pathRef.current = null;
    }
    
    if (arrowsRef.current.length > 0) {
      arrowsRef.current.forEach(arrow => {
        if (arrow) {
          scene.remove(arrow);
          if (arrow.geometry) arrow.geometry.dispose();
          if (arrow.material) arrow.material.dispose();
        }
      });
      arrowsRef.current = [];
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Criar um conegeometria (seta) apontando na direção correta
  const createArrow = (position, direction, color) => {
    const arrowGeometry = new THREE.ConeGeometry(ARROW_SIZE * 0.7, ARROW_SIZE * 1.5, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: PATH_OPACITY,
      depthWrite: false
    });
    
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    
    // Posicionar a seta
    arrow.position.copy(position);
    
    // Rotacionar a seta para apontar na direção correta
    // Primeiro, criar um quaternion para rotacionar de (0,1,0) para a direção desejada
    const upVector = new THREE.Vector3(0, 1, 0);
    arrow.quaternion.setFromUnitVectors(upVector, direction.clone().normalize());
    
    // Marcar como efeito temporário
    arrow.userData.isTemporaryEffect = true;
    arrow.renderOrder = 1001;
    
    scene.add(arrow);
    return arrow;
  };
  
  // Calcular caminho como uma curva Catmull-Rom
  const calculatePath = (origin, destination) => {
    if (!origin || !destination) return null;
    
    // Calcular um ponto intermediário para a curva
    const distance = origin.distanceTo(destination);
    const midPoint = new THREE.Vector3().lerpVectors(origin, destination, 0.5);
    
    // Adicionar altura ao ponto intermediário para criar uma curva natural
    midPoint.y += Math.min(distance * 0.2, 3);
    
    // Criar alguns pontos extras para a curva ficar mais suave
    const points = [
      origin.clone(),
      new THREE.Vector3().lerpVectors(origin, midPoint, 0.3),
      midPoint,
      new THREE.Vector3().lerpVectors(midPoint, destination, 0.7),
      destination.clone()
    ];
    
    // Criar a curva
    const curve = new THREE.CatmullRomCurve3(points);
    return curve;
  };
  
  // Criar o caminho visual
  const createPath = (curve) => {
    if (!curve) return;
    
    // Limpar objetos existentes
    cleanupObjects();
    
    // Criar geometria da curva
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    let material;
    
    // Criar material baseado no tipo de caminho
    switch (pathType) {
      case 1: // Linha pontilhada
        material = new THREE.LineDashedMaterial({
          color: color,
          linewidth: 3,
          scale: 1,
          dashSize: 0.5,
          gapSize: 0.3,
          transparent: true,
          opacity: PATH_OPACITY,
          depthTest: false
        });
        break;
      
      case 0: // Linha contínua
      default:
        material = new THREE.LineBasicMaterial({
          color: color,
          linewidth: 3,
          transparent: true,
          opacity: PATH_OPACITY,
          depthTest: false
        });
        break;
    }
    
    // Criar a linha
    const path = new THREE.Line(geometry, material);
    path.renderOrder = 998; // Renderizado atrás de outros elementos
    
    // Se for linha pontilhada, computar comprimentos para os traços
    if (pathType === 1) {
      path.computeLineDistances();
    }
    
    // Marcar como efeito temporário
    path.userData.isTemporaryEffect = true;
    
    // Adicionar à cena e guardar referência
    scene.add(path);
    pathRef.current = path;
    
    // Se o tipo de caminho for setas, criar setas ao longo do caminho
    if (pathType === 2) {
      // Adicionar várias setas ao longo do caminho
      for (let i = 0; i < NUM_ARROWS; i++) {
        const t = (i + 0.5) / NUM_ARROWS;
        const position = curve.getPointAt(t);
        
        // Obter tangente à curva neste ponto para a orientação da seta
        const tangent = curve.getTangentAt(t);
        
        // Criar seta e salvar na referência
        const arrow = createArrow(position, tangent, color);
        arrowsRef.current.push(arrow);
      }
      
      // Animar as setas ao longo do caminho
      animateArrows(curve);
    }
  };
  
  // Animar as setas ao longo do caminho
  const animateArrows = (curve) => {
    const animationConfig = {
      progress: 0
    };
    
    // Tween para mover as setas ao longo do caminho
    const tween = new TWEEN.Tween(animationConfig)
      .to({ progress: 1 }, 2000) // 2 segundos para percorrer o caminho
      .repeat(Infinity)
      .yoyo(false)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        // Atualizar posição de cada seta
        arrowsRef.current.forEach((arrow, index) => {
          if (!arrow) return;
          
          // Calcular posição para esta seta específica
          const baseT = (index / NUM_ARROWS);
          const t = (baseT + animationConfig.progress) % 1;
          
          // Obter posição e tangente no caminho
          const position = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);
          
          // Atualizar posição e rotação
          arrow.position.copy(position);
          
          // Rotacionar para apontar na direção da curva
          const upVector = new THREE.Vector3(0, 1, 0);
          arrow.quaternion.setFromUnitVectors(upVector, tangent.normalize());
        });
      });
    
    tween.start();
    
    // Função de animação
    const animate = () => {
      TWEEN.update();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Efeito para criar e gerenciar o caminho
  useEffect(() => {
    // Sair se não estiver ativo ou faltar algum componente necessário
    if (!isActive || !scene || !originPosition || !destinationPosition) {
      cleanupObjects();
      return;
    }
    
    // Calcular o caminho
    const curve = calculatePath(originPosition, destinationPosition);
    
    // Criar visualização do caminho
    if (curve) {
      createPath(curve);
    }
    
    // Limpar ao desmontar ou quando isActive se torna false
    return () => {
      cleanupObjects();
    };
  }, [scene, originPosition, destinationPosition, isActive, color, pathType]);
  
  // Este componente não renderiza nada no DOM, apenas manipula objetos 3D
  return null;
};

export default PathVisualization;