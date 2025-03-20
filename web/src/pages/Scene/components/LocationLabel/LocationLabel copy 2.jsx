import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LocationLabel.scss";

const LocationLabel = ({ world, modelRef, targetMeshName = "Você_está_aqui" }) => {
  const labelRef = useRef();
  const lineRef = useRef();
  const targetPositionRef = useRef(null);
  const updateCountRef = useRef(0);

  useEffect(() => {
    console.log("LocationLabel: useEffect iniciado.", { world, modelRef, targetMeshName });
    if (!world || !modelRef || !modelRef.current) {
      console.warn("LocationLabel: world ou modelRef não disponíveis.");
      return;
    }
    
    // Procurar a mesh alvo
    let targetMesh = null;
    modelRef.current.traverse((child) => {
      console.log("LocationLabel: Verificando mesh:", child.name);
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
    console.log("LocationLabel: BoundingBox da mesh alvo:", boundingBox);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    targetMesh.localToWorld(center);
    console.log("LocationLabel: Centro calculado (mundo):", center);
    targetPositionRef.current = center;
    
    // Criar linha que conecta a etiqueta ao ponto
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4e50,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
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
    console.log("LocationLabel: Linha de conexão criada e adicionada à cena.");
    
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
      
      if (updateCountRef.current % 60 === 0) {
        console.log("LocationLabel: updateLabelPosition:", {
          screenX: x,
          screenY: y - 50,
          distance,
          scale,
          targetLabelPosition
        });
      }
      
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
      
      if (updateCountRef.current % 60 === 0) {
        console.log("LocationLabel: isInView:", isInView, "isInFront:", isInFront);
      }
      
      if (isInView && isInFront) {
        labelRef.current.classList.add("visible");
        labelRef.current.classList.remove("hidden");
      } else {
        labelRef.current.classList.add("hidden");
        labelRef.current.classList.remove("visible");
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
    };
  }, [world, modelRef, targetMeshName]);
  
  return (
    <div 
      ref={labelRef}
      className="location-label hidden"
    >
      <div className="label-content">
        <span>Você está aqui</span>
      </div>
    </div>
  );
  
};

export default LocationLabel;
