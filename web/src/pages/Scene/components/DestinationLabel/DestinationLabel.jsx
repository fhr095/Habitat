import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import "./DestinationLabel.scss";

// Ícone SVG para o marcador de destino
const DestinationIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="destination-icon"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
  </svg>
);

const DestinationLabel = ({ 
  world, 
  scene, 
  camera, 
  controls, 
  destinationObject, 
  destinationName, 
  currentLocation, 
  isActive, 
  color = 0xFF7D45, // Usando o laranja primário como padrão
  locationLabelRef // Referência para o LocationLabel para evitar sobreposição
}) => {
  const labelRef = useRef();
  const lineRef = useRef();
  const pulseRef = useRef();
  const targetPositionRef = useRef(null);
  const prevLabelPositionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef(null);
  const labelSizeRef = useRef({ width: 0, height: 0 });
  const animationFrameId = useRef(null);
  const [positionAdjustment, setPositionAdjustment] = useState(null);

  // Configurações de cor e estilo
  const COLOR_DESTINATION = color;
  const PULSE_OPACITY = 0.7;
  const LINE_OPACITY = 0.9;
  const LINE_WIDTH = 2;

  // Formatar nome do destino para exibição mais amigável
  const formatLocationName = (name) => {
    if (!name) return "Destino";
    
    // Substituir underscores por espaços
    let formatted = name.replace(/_/g, " ");
    
    // Capitalizar primeira letra de cada palavra
    formatted = formatted.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    
    // Remover prefixos comuns de nomes de objetos
    formatted = formatted.replace(/^(Area|Praca|Bloco|Setor|Predio)[\s-]*/i, "");
    
    // Limitar tamanho para evitar textos muito longos
    if (formatted.length > 30) {
      formatted = formatted.substring(0, 27) + "...";
    }
    
    return formatted;
  };

  // Verificar se há sobreposição com o LocationLabel
  const checkLabelOverlap = () => {
    if (!locationLabelRef || !locationLabelRef.current || !labelRef.current) return false;
    
    const locationRect = locationLabelRef.current.getBoundingClientRect();
    const destRect = labelRef.current.getBoundingClientRect();
    
    // Verificar sobreposição
    const hasOverlap = !(
      destRect.right < locationRect.left || 
      destRect.left > locationRect.right || 
      destRect.bottom < locationRect.top || 
      destRect.top > locationRect.bottom
    );
    
    if (hasOverlap) {
      // Determinar melhor direção para ajustar baseado nas posições relativas
      const destCenterX = (destRect.left + destRect.right) / 2;
      const locationCenterX = (locationRect.left + locationRect.right) / 2;
      const destCenterY = (destRect.top + destRect.bottom) / 2;
      const locationCenterY = (locationRect.top + locationRect.bottom) / 2;
      
      const diffX = destCenterX - locationCenterX;
      const diffY = destCenterY - locationCenterY;
      
      // Escolher ajuste com base na maior diferença
      if (Math.abs(diffX) > Math.abs(diffY)) {
        return diffX > 0 ? 'adjust-right' : 'adjust-left';
      } else {
        return diffY > 0 ? 'adjust-bottom' : 'adjust-top';
      }
    }
    
    return false;
  };

  useEffect(() => {
    if (!isActive || !world || !scene || !camera || !destinationObject) {
      return;
    }
    
    console.log("DestinationLabel: destino ativado:", destinationName);
    
    // Calcular posição central do objeto de destino
    let targetPosition = new THREE.Vector3();
    
    if (destinationObject.geometry) {
      destinationObject.geometry.computeBoundingBox();
      const boundingBox = destinationObject.geometry.boundingBox;
      boundingBox.getCenter(targetPosition);
      destinationObject.localToWorld(targetPosition);
    } else {
      // Se não for uma mesh com geometria, usar a posição do objeto
      destinationObject.getWorldPosition(targetPosition);
    }
    
    console.log("DestinationLabel: Posição do destino (mundo):", targetPosition);
    targetPositionRef.current = targetPosition;
    
    // Configurar material da linha com maior espessura e qualidade
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: COLOR_DESTINATION,
      linewidth: LINE_WIDTH,
      transparent: true,
      opacity: LINE_OPACITY,
      depthTest: false
    });
    
    // Usar mais pontos para a linha para curvas mais suaves
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(120); // Aumentado para mais pontos
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.renderOrder = 999;
    scene.add(line);
    lineRef.current = line;
    
    // Adicionar efeito de pulse no ponto de destino
    const pulseGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_DESTINATION,
      transparent: true,
      opacity: PULSE_OPACITY,
      depthWrite: false,
      depthTest: false
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(targetPosition);
    pulse.renderOrder = 1000;
    pulse.name = "destination-pulse";
    pulse.userData.isTemporaryEffect = true;
    scene.add(pulse);
    pulseRef.current = pulse;
    
    // Inicializar o tamanho do rótulo quando disponível
    if (labelRef.current) {
      labelSizeRef.current = {
        width: labelRef.current.offsetWidth,
        height: labelRef.current.offsetHeight
      };
    }
    
    // Animação de pulsação melhorada para o destino
    const animatePulse = () => {
      if (!pulseRef.current) return;
      
      const scale = { value: 0.7 };
      const opacity = { value: PULSE_OPACITY };
      
      new TWEEN.Tween(scale)
        .to({ value: 1.5 }, 1200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (pulseRef.current) {
            pulseRef.current.scale.set(scale.value, scale.value, scale.value);
          }
        })
        .start();
        
      new TWEEN.Tween(opacity)
        .to({ value: 0.1 }, 1200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (pulseRef.current && pulseRef.current.material) {
            pulseRef.current.material.opacity = opacity.value;
          }
        })
        .onComplete(() => {
          if (pulseRef.current) {
            pulseRef.current.scale.set(0.7, 0.7, 0.7);
            pulseRef.current.material.opacity = PULSE_OPACITY;
            
            // Repetir a animação
            animationRef.current = setTimeout(animatePulse, 300);
          }
        })
        .start();
    };
    
    // Iniciar animação de pulsação
    animatePulse();
    
    // Função para atualizar a posição da etiqueta e da linha
    const updateLabelPosition = () => {
      if (!targetPositionRef.current || !labelRef.current || !lineRef.current || !isActive) return;
      
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
      tempV.project(camera);
      
      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = ((-tempV.y) * 0.5 + 0.5) * window.innerHeight;
      
      // Calcular a distância da câmera ao ponto
      const distance = targetPositionRef.current.distanceTo(camera.position);
      
      // Ajustar a posição da etiqueta baseado na direção da câmera
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      
      // Vetor do ponto para a câmera
      const toCameraDir = camera.position.clone().sub(targetPositionRef.current).normalize();
      
      // Ângulo entre os vetores para determinar o lado da etiqueta
      const dot = cameraDir.dot(toCameraDir);
      
      // Calcular o offset para evitar sobreposição com o modelo
      let xOffset = 0;
      let yOffset = -90; // Aumentado para maior espaçamento
      
      // Ajustar posição baseado no ângulo de visualização e distância
      if (dot < -0.5) {
        // Câmera olhando aproximadamente na direção oposta ao objeto
        yOffset = -Math.max(160, labelSizeRef.current.height + 30);
      } else if (dot > 0.5) {
        // Câmera olhando aproximadamente na direção do objeto
        const sideOffset = Math.max(labelSizeRef.current.width * 0.7, window.innerWidth * 0.06);
        xOffset = sideOffset * (tempV.x > 0 ? 1 : -1);
        yOffset = -Math.max(60, labelSizeRef.current.height * 0.8);
      }
      
      // Ajustar offset baseado na distância para melhor visibilidade
      const distanceScale = Math.min(1, distance / 50);
      yOffset *= (0.8 + distanceScale * 0.2);
      
      // Calcular posição final da etiqueta
      const finalX = x + xOffset;
      const finalY = y + yOffset;
      
      // Ajustar para garantir que a etiqueta não saia da tela
      const safeX = Math.min(Math.max(finalX, labelSizeRef.current.width * 0.5), window.innerWidth - labelSizeRef.current.width * 0.5);
      const safeY = Math.min(Math.max(finalY, labelSizeRef.current.height), window.innerHeight - 30);
      
      // Posicionar a etiqueta
      labelRef.current.style.transform = `translate(-50%, -100%) translate(${safeX}px, ${safeY}px)`;
      
      // Verificar sobreposição depois que a posição foi atualizada
      setTimeout(() => {
        const adjustment = checkLabelOverlap();
        if (adjustment !== positionAdjustment) {
          setPositionAdjustment(adjustment);
        }
      }, 50);
      
      // Ajustar o tamanho da etiqueta baseado na distância da câmera
      const scale = Math.max(0.85, Math.min(1.2, 45 / distance));
      labelRef.current.style.fontSize = `${scale}rem`;
      labelRef.current.style.padding = `${scale * 0.5}rem ${scale * 0.8}rem`;
      
      // SOLUÇÃO PARA O PROBLEMA DA LINHA: Usar uma abordagem mais precisa para conectar a linha ao balão
      
      // 1. Posição de destino no mundo (ponto fixo)
      const startPoint = targetPositionRef.current.clone();
      
      // 2. Converter a posição do balão 2D para 3D para garantir conexão precisa
      // Primeiro, posição na base do balão (onde a seta aponta)
      const labelBaseX = safeX;
      const labelBaseY = safeY + 8; // +8 para apontar na seta do balão
      
      // Converter para coordenadas normalizadas de dispositivo (-1 a 1)
      const ndcX = (labelBaseX / window.innerWidth) * 2 - 1;
      const ndcY = -(labelBaseY / window.innerHeight) * 2 + 1;
      
      // Criar um vetor com essas coordenadas e profundidade z
      const labelVector = new THREE.Vector3(ndcX, ndcY, 0.5);
      
      // "Desprojetar" para obter a posição 3D correspondente à posição do balão
      labelVector.unproject(camera);
      
      // Direção da câmera para essa posição
      const dir = labelVector.sub(camera.position).normalize();
      
      // Determinar um ponto no espaço que corresponde à posição do balão
      // Usar a distância do objeto ao invés de um valor fixo para melhor precisão
      const distanceToLabel = distance * 0.9;
      const endPoint = camera.position.clone().add(dir.multiplyScalar(distanceToLabel));
      
      // Armazenar a posição anterior para suavização, se disponível
      let finalEndPoint;
      if (prevLabelPositionRef.current) {
        // Usar interpolação com inércia para movimentos mais suaves
        // Quanto menor o fator, mais suave (e potencialmente mais lento) o movimento
        const lerpFactor = 0.25; // Ajuste para menor valor = linha mais estável
        finalEndPoint = prevLabelPositionRef.current.clone().lerp(endPoint, lerpFactor);
      } else {
        finalEndPoint = endPoint;
      }
      
      // Atualizar a posição anterior para o próximo frame
      prevLabelPositionRef.current = finalEndPoint.clone();
      
      // 3. Criar uma curva de Bezier melhorada que sempre conecta os dois pontos
      // Ponto de controle da curva - mais próximo do ponto de origem para curva natural
      const distanceBetweenPoints = startPoint.distanceTo(finalEndPoint);
      const midPoint = new THREE.Vector3().addVectors(
        startPoint.clone().multiplyScalar(0.7), 
        finalEndPoint.clone().multiplyScalar(0.3)
      );
      
      // Adicionar alguma curvatura baseada na distância entre os pontos
      const heightOffset = Math.min(distanceBetweenPoints * 0.15, 3);
      midPoint.y += heightOffset;
      
      // Criar curva de Bezier quadrática com mais pontos para suavidade
      const curve = new THREE.QuadraticBezierCurve3(
        startPoint,
        midPoint,
        finalEndPoint
      );
      
      // 4. Criar mais pontos para linha mais suave
      const points = curve.getPoints(35); // Mais pontos = curva mais suave
      
      // 5. Atualizar a geometria da linha com os novos pontos
      const positionsArray = lineRef.current.geometry.attributes.position.array;
      for (let i = 0; i < points.length; i++) {
        const idx = i * 3;
        if (idx + 2 < positionsArray.length) {
          positionsArray[idx] = points[i].x;
          positionsArray[idx + 1] = points[i].y;
          positionsArray[idx + 2] = points[i].z;
        }
      }
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      lineRef.current.geometry.setDrawRange(0, points.length);
      
      // Atualizar TWEEN para animações suaves
      TWEEN.update();
      
      // Verificar se o alvo está visível na cena
      const frustum = new THREE.Frustum();
      const matrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix, 
        camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(matrix);
      const isInView = frustum.containsPoint(targetPositionRef.current);
      
      // Verificar se o alvo está à frente da câmera
      const dirFromCamera = new THREE.Vector3().subVectors(targetPositionRef.current, camera.position);
      const isInFront = dirFromCamera.dot(camera.getWorldDirection(new THREE.Vector3())) > 0;
      
      // Distância máxima para visibilidade (evita mostrar destinos muito distantes)
      const isWithinVisibleDistance = distance < 150;
      
      // Atualizar visibilidade
      const shouldBeVisible = isInView && isInFront && isActive && isWithinVisibleDistance;
      
      // Aplicar visibilidade com transição suave
      if (shouldBeVisible !== isVisible) {
        setIsVisible(shouldBeVisible);
        if (shouldBeVisible) {
          labelRef.current.classList.add("visible");
          labelRef.current.classList.remove("hidden");
          if (lineRef.current) {
            new TWEEN.Tween({ opacity: 0 })
              .to({ opacity: LINE_OPACITY }, 400)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate(({ opacity }) => {
                lineRef.current.material.opacity = opacity;
              })
              .start();
          }
        } else {
          labelRef.current.classList.add("hidden");
          labelRef.current.classList.remove("visible");
          if (lineRef.current) {
            new TWEEN.Tween({ opacity: lineRef.current.material.opacity })
              .to({ opacity: 0.1 }, 400)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate(({ opacity }) => {
                lineRef.current.material.opacity = opacity;
              })
              .start();
          }
        }
      }
    };
    
    // Usar requestAnimationFrame para animação suave
    const renderLoop = () => {
      updateLabelPosition();
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
    
    // Limpar recursos ao desmontar ou quando isActive se torna false
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (lineRef.current) {
        scene.remove(lineRef.current);
        lineRef.current.geometry.dispose();
        lineRef.current.material.dispose();
        lineRef.current = null;
      }
      
      if (pulseRef.current) {
        scene.remove(pulseRef.current);
        pulseRef.current.geometry.dispose();
        pulseRef.current.material.dispose();
        pulseRef.current = null;
      }
      
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      
      prevLabelPositionRef.current = null;
    };
  }, [world, scene, camera, destinationObject, destinationName, isActive, color]);

  // Aplicar classes de ajuste para evitar sobreposição
  useEffect(() => {
    if (!labelRef.current) return;
    
    // Remover todas as classes de ajuste anteriores
    labelRef.current.classList.remove('adjust-right', 'adjust-left', 'adjust-top', 'adjust-bottom');
    
    // Aplicar nova classe de ajuste se necessário
    if (positionAdjustment) {
      labelRef.current.classList.add(positionAdjustment);
    }
  }, [positionAdjustment]);
  
  // Renderizar o componente apenas se estiver ativo
  if (!isActive) return null;
  
  // Convertemos o valor hexadecimal para uma string CSS
  const colorHex = `#${new THREE.Color(color).getHexString()}`;
  
  return (
    <div 
      ref={labelRef}
      className="destination-label hidden"
      style={{ 
        '--destination-color': colorHex
      }}
    >
      <div className="label-content">
        <DestinationIcon />
        <span>{formatLocationName(destinationName)}</span>
      </div>
    </div>
  );
};

export default DestinationLabel;