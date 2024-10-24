import React, { useContext } from "react";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { useAnimations } from "../../../../context/AnimationContext";
import "./ControlPanel.scss";

const ControlPanel = () => {
    const { animations } = useAnimations() || {};
    const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
    const objectsStatus = sceneConfig.bloomEffect.status || {};

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setSceneConfig((prevConfig) => {
            const newValue = type === "checkbox" ? checked : value;
            switch (name) {
                // Background color
                case "backgroundColor":
                    return { ...prevConfig, backgroundColor: newValue };

                // Camera settings
                case "cameraType":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, type: newValue }
                    };
                case "autoRotate":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, autoRotate: checked }
                    };
                case "autoRotateSpeed":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, autoRotateSpeed: parseFloat(newValue) }
                    };
                case "zoomEnabled":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, zoomEnabled: checked }
                    };
                case "cameraPositionX":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, position: { ...prevConfig.camera.position, x: parseFloat(newValue) } }
                    };
                case "cameraPositionY":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, position: { ...prevConfig.camera.position, y: parseFloat(newValue) } }
                    };
                case "cameraPositionZ":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, position: { ...prevConfig.camera.position, z: parseFloat(newValue) } }
                    };
                case "cameraDirectionX":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, direction: { ...prevConfig.camera.direction, x: parseFloat(newValue) } }
                    };
                case "cameraDirectionY":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, direction: { ...prevConfig.camera.direction, y: parseFloat(newValue) } }
                    };
                case "cameraDirectionZ":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, direction: { ...prevConfig.camera.direction, z: parseFloat(newValue) } }
                    };
                case "movementLimitsMin":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, movementLimits: { ...prevConfig.camera.movementLimits, y: [parseFloat(newValue), prevConfig.camera.movementLimits?.y[1] || 0] } }
                    };
                case "movementLimitsMax":
                    return {
                        ...prevConfig,
                        camera: { ...prevConfig.camera, movementLimits: { ...prevConfig.camera.movementLimits, y: [prevConfig.camera.movementLimits?.y[0] || 0, parseFloat(newValue)] } }
                    };

                // Light settings
                case "lightType":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, type: newValue }
                    };
                case "lightIntensity":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, intensity: parseFloat(newValue) }
                    };
                case "lightPositionX":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, position: { ...prevConfig.light.position, x: parseFloat(newValue) } }
                    };
                case "lightPositionY":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, position: { ...prevConfig.light.position, y: parseFloat(newValue) } }
                    };
                case "lightPositionZ":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, position: { ...prevConfig.light.position, z: parseFloat(newValue) } }
                    };
                case "lightQuantity":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, quantity: parseInt(newValue) }
                    };
                case "shadowsEnabled":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, shadowsEnabled: checked }
                    };
                case "shadowIntensity":
                    return {
                        ...prevConfig,
                        light: { ...prevConfig.light, shadowIntensity: parseFloat(newValue) }
                    };

                // Material settings
                case "transparencyEnabled":
                    return {
                        ...prevConfig,
                        materialSettings: { ...prevConfig.materialSettings, transparencyEnabled: checked }
                    };
                case "materialOpacity":
                    return {
                        ...prevConfig,
                        materialSettings: { ...prevConfig.materialSettings, materialOpacity: parseFloat(newValue) }
                    };

                // Render settings
                case "lodEnabled":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, lodEnabled: checked }
                    };
                case "lodDistance":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, lodDistance: parseFloat(newValue) }
                    };
                case "ambientOcclusionEnabled":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, ambientOcclusionEnabled: checked }
                    };
                case "pixelRatio":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, pixelRatio: parseFloat(newValue) }
                    };
                case "antiAliasingEnabled":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, antiAliasingEnabled: checked }
                    };

                // Partículas
                case "particlesEnabled":
                    return {
                    ...prevConfig,
                    renderSettings: { ...prevConfig.renderSettings, particlesEnabled: checked }
                    };
                case "particleCount":
                    return {
                    ...prevConfig,
                    renderSettings: { ...prevConfig.renderSettings, particleCount: parseInt(newValue) }
                    };
                case "particleSize":
                    return {
                    ...prevConfig,
                    renderSettings: { ...prevConfig.renderSettings, particleSize: parseFloat(newValue) }
                    };
                case "particleEffectType":
                    return {
                        ...prevConfig,
                        renderSettings: { ...prevConfig.renderSettings, particleEffectType: newValue }
                    };
                case "fogEnabled":
                    return { 
                        ...prevConfig, 
                        fogSettings: { ...prevConfig.fogSettings, enabled: checked } 
                    };
                case "fogColor":
                    return {
                        ...prevConfig, 
                        fogSettings: { ...prevConfig.fogSettings, color: newValue } 
                    };
                case "fogDensity":
                    return { 
                        ...prevConfig, 
                        fogSettings: { ...prevConfig.fogSettings, density: parseFloat(newValue) } 
                    };
                case "waterEnabled":
                    return { 
                        ...prevConfig, 
                        water: { ...prevConfig.water, enabled: checked } 
                    };
                case "waterColor":
                    return { 
                        ...prevConfig, 
                        water: { ...prevConfig.water, color: newValue } 
                    };
                case "waterScale":
                    return { 
                        ...prevConfig, 
                        water: { ...prevConfig.water, scale: parseFloat(newValue) } 
                    };

                // Configurações do Skybox
                case "skyboxEnabled":
                    return {
                    ...prevConfig,
                    skyboxSettings: { ...prevConfig.skyboxSettings, enabled: checked },
                    };
                case "environmentMapEnabled":
                    return {
                    ...prevConfig,
                    skyboxSettings: { ...prevConfig.skyboxSettings, environmentMapEnabled: checked },
                    };
                case "texturePath":
                    return {
                    ...prevConfig,
                    skyboxSettings: { ...prevConfig.skyboxSettings, texturePath: newValue },
                    };

                    // Tone Mapping
                case "toneMappingEnabled":
                    return {
                    ...prevConfig,
                    renderSettings: { ...prevConfig.renderSettings, toneMappingEnabled: checked }
                    };
        
                // envMapIntensity
                case "envMapIntensity":
                    return {
                    ...prevConfig,
                    renderSettings: { ...prevConfig.renderSettings, envMapIntensity: parseFloat(newValue) }
                    };
        
                // Metalness
                case "metalness":
                    return {
                    ...prevConfig,
                    materialSettings: { ...prevConfig.materialSettings, metalness: parseFloat(newValue) }
                    };
        
                // Roughness
                case "roughness":
                    return {
                    ...prevConfig,
                    materialSettings: { ...prevConfig.materialSettings, roughness: parseFloat(newValue) }
                    };
  
                // Animação: índice
                case "animationIndex":
                    return {
                        ...prevConfig,
                        animationIndex: parseInt(newValue, 10) // Salva o índice da animação selecionada
                    };

                // Animação: velocidade
                case "animationSpeed":
                    return {
                        ...prevConfig,
                        animationSpeed: parseFloat(newValue) // Ajusta a velocidade da animação
                    };

                // Animação: play/pause
                case "animationPaused":
                    return {
                        ...prevConfig,
                        animationPaused: checked // Define se a animação está pausada
                    };
                case "bloomEnabled":
                    return {
                        ...prevConfig,
                        bloomEffect: { ...prevConfig.bloomEffect, enabled: checked }
                    };
                case "bloomStrength":
                    return {
                        ...prevConfig,
                        bloomEffect: { ...prevConfig.bloomEffect, strength: parseFloat(newValue) }
                    };
                case "bloomRadius":
                    return {
                        ...prevConfig,
                        bloomEffect: { ...prevConfig.bloomEffect, radius: parseFloat(newValue) }
                    };
                case "bloomThreshold":
                    return {
                        ...prevConfig,
                        bloomEffect: { ...prevConfig.bloomEffect, threshold: parseFloat(newValue) }
                    };

                // Controle de seleção de objetos no bloomEffect.status
                /*case "bloomEffectSelection":
                    return {
                    ...prevConfig,
                    bloomEffect: {
                        ...prevConfig.bloomEffect,
                        status: {
                            ...prevConfig.bloomEffect.status,
                            [value]: {
                              ...prevConfig.bloomEffect.status[value], // Mantém o nome original
                              status: checked, // Atualiza apenas o status
                            },
                          },*/
                          /*status: {
                            ...prevConfig.bloomEffect.status,
                            [value]: checked, // Atualiza o estado (true ou false)
                            },*/
                    /*},
                    };*/

                // Controle de seleção de objetos no bloomEffect.status
                case "bloomEffectSelection":
                    return {
                        ...prevConfig,
                        bloomEffect: {
                        ...prevConfig.bloomEffect,
                        status: {
                            ...prevConfig.bloomEffect.status,
                            [value]: {
                            ...prevConfig.bloomEffect.status[value], // Mantém o nome e emissiveIntensity
                            status: checked, // Atualiza apenas o status
                            },
                        },
                        },
                    };

                // Controle de emissividade dos objetos
                case "emissiveIntensity":
                const uuid = event.target.dataset.uuid; // O uuid é armazenado no data-attribute
                const emissiveIntensity = parseFloat(event.target.value);
                    return {
                        ...prevConfig,
                        bloomEffect: {
                        ...prevConfig.bloomEffect,
                        status: {
                            ...prevConfig.bloomEffect.status,
                            [uuid]: {
                            ...prevConfig.bloomEffect.status[uuid],
                            emissiveIntensity: emissiveIntensity,
                            },
                        },
                        },
                    };

                default:
                    return prevConfig;
            }
        });
    };    
    

    return (
        <div className="control-panel">
            <h3>Painel de Controle da Cena</h3>
    
            {/* Cor de fundo */}
            <label>
                Cor do Fundo:
                <input
                    type="color"
                    name="backgroundColor"
                    value={sceneConfig.backgroundColor}
                    onChange={handleChange}
                />
            </label>
    
            {/* Tipo de câmera */}
            <label>
                Tipo de Câmera:
                <select
                    name="cameraType"
                    value={sceneConfig.camera.type}
                    onChange={handleChange}
                >
                    <option value="perspective">Perspectiva</option>
                    <option value="orthographic">Ortográfica</option>
                </select>
            </label>
    
            {/* Posição da Câmera */}
            <label>
                Posição da Câmera (X, Y, Z):
                <input
                    type="number"
                    name="cameraPositionX"
                    value={sceneConfig.camera.position.x}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="cameraPositionY"
                    value={sceneConfig.camera.position.y}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="cameraPositionZ"
                    value={sceneConfig.camera.position.z}
                    onChange={handleChange}
                />
            </label>
    
            {/* Direção da Câmera */}
            <label>
                Direção da Câmera (X, Y, Z):
                <input
                    type="number"
                    name="cameraDirectionX"
                    value={sceneConfig.camera.direction.x}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="cameraDirectionY"
                    value={sceneConfig.camera.direction.y}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="cameraDirectionZ"
                    value={sceneConfig.camera.direction.z}
                    onChange={handleChange}
                />
            </label>
    
            {/* Auto-Rotação */}
            <label>
                Auto-Rotação:
                <input
                    type="checkbox"
                    name="autoRotate"
                    checked={sceneConfig.camera.autoRotate}
                    onChange={handleChange}
                />
            </label>
    
            {/* Velocidade de Rotação */}
            <label>
                Velocidade de Rotação:
                <input
                    type="number"
                    name="autoRotateSpeed"
                    value={sceneConfig.camera.autoRotateSpeed}
                    onChange={handleChange}
                    step="0.1"
                />
            </label>
    
            {/* Zoom Habilitado */}
            <label>
                Zoom Habilitado:
                <input
                    type="checkbox"
                    name="zoomEnabled"
                    checked={sceneConfig.camera.zoomEnabled}
                    onChange={handleChange}
                />
            </label>
    
            {/* Limites de Movimento */}
            <label>
                Limite de Movimento - Ângulo Mínimo:
                <input
                    type="number"
                    name="movementLimitsMin"
                    value={sceneConfig.camera.movementLimits?.y[0] || 0}
                    onChange={handleChange}
                />
            </label>
            <label>
                Limite de Movimento - Ângulo Máximo:
                <input
                    type="number"
                    name="movementLimitsMax"
                    value={sceneConfig.camera.movementLimits?.y[1] || 0}
                    onChange={handleChange}
                />
            </label>
    
            {/* Luzes */}
            <label>
                Tipo de Luz:
                <select
                    name="lightType"
                    value={sceneConfig.light.type}
                    onChange={handleChange}
                >
                    <option value="ambient">Ambiente</option>
                    <option value="directional">Direcional</option>
                </select>
            </label>
    
            <label>
                Intensidade da Luz:
                <input
                    type="range"
                    name="lightIntensity"
                    value={sceneConfig.light.intensity}
                    onChange={handleChange}
                    min="0"
                    max="2"
                    step="0.1"
                />
            </label>
    
            <label>
                Posição da Luz (X, Y, Z):
                <input
                    type="number"
                    name="lightPositionX"
                    value={sceneConfig.light.position.x}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="lightPositionY"
                    value={sceneConfig.light.position.y}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="lightPositionZ"
                    value={sceneConfig.light.position.z}
                    onChange={handleChange}
                />
            </label>
    
            <label>
                Quantidade de Luzes:
                <input
                    type="number"
                    name="lightQuantity"
                    value={sceneConfig.light.quantity}
                    onChange={handleChange}
                    min="1"
                    step="1"
                />
            </label>
    
            <label>
                Sombras Habilitadas:
                <input
                    type="checkbox"
                    name="shadowsEnabled"
                    checked={sceneConfig.light.shadowsEnabled}
                    onChange={handleChange}
                />
            </label>
    
            <label>
                Intensidade das Sombras:
                <input
                    type="range"
                    name="shadowIntensity"
                    value={sceneConfig.light.shadowIntensity}
                    onChange={handleChange}
                    min="0"
                    max="2"
                    step="0.1"
                />
            </label>
    
            {/* Transparência e opacidade */}
            <label>
                Transparência Habilitada:
                <input
                    type="checkbox"
                    name="transparencyEnabled"
                    checked={sceneConfig.materialSettings.transparencyEnabled}
                    onChange={handleChange}
                />
            </label>
    
            <label>
                Opacidade do Material:
                <input
                    type="range"
                    name="materialOpacity"
                    value={sceneConfig.materialSettings.materialOpacity}
                    onChange={handleChange}
                    min="0"
                    max="1"
                    step="0.1"
                />
            </label>
    
            {/* Anti-Aliasing */}
            <label>
                Anti-Aliasing Habilitado:
                <input
                    type="checkbox"
                    name="antiAliasingEnabled"
                    checked={sceneConfig.renderSettings.antiAliasingEnabled}
                    onChange={handleChange}
                />
            </label>
    
            {/* LOD */}
            <label>
                LOD Habilitado:
                <input
                    type="checkbox"
                    name="lodEnabled"
                    checked={sceneConfig.renderSettings.lodEnabled}
                    onChange={handleChange}
                />
            </label>
    
            <label>
                Distância do LOD:
                <input
                    type="number"
                    name="lodDistance"
                    value={sceneConfig.renderSettings.lodDistance || 0}
                    onChange={handleChange}
                />
            </label>
    
            {/* Ambient Occlusion */}
            <label>
                Ambient Occlusion Habilitado:
                <input
                    type="checkbox"
                    name="ambientOcclusionEnabled"
                    checked={sceneConfig.renderSettings.ambientOcclusionEnabled}
                    onChange={handleChange}
                />
            </label>
    
            {/* Pixel Ratio */}
            <label>
                Pixel Ratio:
                <input
                    type="number"
                    name="pixelRatio"
                    value={sceneConfig.renderSettings.pixelRatio}
                    onChange={handleChange}
                    step="0.1"
                />
            </label>

            {/* Habilitar Partículas */}
            <label>
                Ativar Partículas:
                <input
                type="checkbox"
                name="particlesEnabled"
                checked={sceneConfig.renderSettings.particlesEnabled}
                onChange={handleChange}
                />
            </label>

            {/* Quantidade de Partículas */}
            {sceneConfig.renderSettings.particlesEnabled && (
                <>
                <label>
                    Quantidade de Partículas:
                    <input
                    type="number"
                    name="particleCount"
                    value={sceneConfig.renderSettings.particleCount}
                    onChange={handleChange}
                    />
                </label>

                {/* Tamanho das Partículas */}
                <label>
                    Tamanho das Partículas:
                    <input
                    type="number"
                    name="particleSize"
                    value={sceneConfig.renderSettings.particleSize}
                    onChange={handleChange}
                    step="0.01"
                    />
                </label>
                </>
            )}

            <label>
                Tipo de Efeito de Partículas:
                <select
                    name="particleEffectType"
                    value={sceneConfig.renderSettings.particleEffectType}
                    onChange={handleChange} // Usa o handleChange para atualizar o valor
                >
                    <option value="generic">Genérico</option>
                    <option value="dust">Poeira</option>
                    <option value="snow">Neve</option>
                    <option value="rain">Chuva</option>
                    <option value="explosion">Explosão</option>
                </select>
            </label>
            {/* Ativar/Desativar Névoa */}
      <label>
        Ativar Névoa:
        <input
          type="checkbox"
          name="fogEnabled"
          checked={sceneConfig.fogSettings.enabled}
          onChange={handleChange}
        />
      </label>

      {/* Cor da Névoa */}
      {sceneConfig.fogSettings.enabled && (
        <>
          <label>
            Cor da Névoa:
            <input
              type="color"
              name="fogColor"
              value={sceneConfig.fogSettings.color}
              onChange={handleChange}
            />
          </label>

          {/* Densidade da Névoa */}
          <label>
            Densidade da Névoa:
            <input
              type="number"
              name="fogDensity"
              value={sceneConfig.fogSettings.density}
              min="0.001"
              max="0.1"
              step="0.001"
              onChange={handleChange}
            />
          </label>
        </>
      )}

            {/* Ativar/Desativar Água */}
            <label>
                Ativar Água:
                <input
                    type="checkbox"
                    name="waterEnabled"
                    checked={sceneConfig.water.enabled}
                    onChange={handleChange}
                />
                </label>

                {/* Cor da Água */}
                <label>
                Cor da Água:
                <input
                    type="color"
                    name="waterColor"
                    value={sceneConfig.water.color}
                    onChange={handleChange}
                />
                </label>

                {/* Escala da Água */}
                <label>
                Escala da Água:
                <input
                    type="number"
                    name="waterScale"
                    value={sceneConfig.water.scale}
                    step="0.1"
                    onChange={handleChange}
                />
                </label>

                {/* Ativar/desativar Skybox */}
                <label>
                    Skybox Ativado:
                    <input
                    type="checkbox"
                    name="skyboxEnabled"
                    checked={sceneConfig.skyboxSettings.enabled}
                    onChange={handleChange}
                    />
                </label>

                {/* Caminho da textura do Skybox */}
                <label>
                    Caminho da Textura do Skybox:
                    <input
                    type="text"
                    name="texturePath"
                    value={sceneConfig.skyboxSettings.texturePath}
                    onChange={handleChange}
                    />
                </label>

                {/* Ativar/desativar Environment Map */}
                <label>
                    Environment Map Ativado:
                    <input
                    type="checkbox"
                    name="environmentMapEnabled"
                    checked={sceneConfig.skyboxSettings.environmentMapEnabled}
                    onChange={handleChange}
                    />
                </label>
                      {/* Tone Mapping */}
                <label>
                    Tone Mapping:
                    <input
                    type="checkbox"
                    name="toneMappingEnabled"
                    checked={sceneConfig.renderSettings.toneMappingEnabled}
                    onChange={handleChange}
                    />
                </label>

                {/* Intensidade do Environment Map */}
                <label>
                    Intensidade do Environment Map:
                    <input
                    type="range"
                    name="envMapIntensity"
                    min="0"
                    max="5"
                    step="0.1"
                    value={sceneConfig.renderSettings.envMapIntensity}
                    onChange={handleChange}
                    />
                </label>

                {/* Metalness */}
                <label>
                    Metalness:
                    <input
                    type="range"
                    name="metalness"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sceneConfig.materialSettings.metalness}
                    onChange={handleChange}
                    />
                </label>

                {/* Roughness */}
                <label>
                    Roughness:
                    <input
                    type="range"
                    name="roughness"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sceneConfig.materialSettings.roughness}
                    onChange={handleChange}
                    />
                </label>

        <label>
            Selecionar Animação:
            <select
              name="animationIndex"
              value={sceneConfig.animationIndex || 0}
              onChange={handleChange}
            >
              {animations.map((clip, index) => (
                <option key={index} value={index}>
                  {clip.name || `Animação ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          {/* Velocidade da Animação */}
          <label>
            Velocidade da Animação:
            <input
              type="number"
              name="animationSpeed"
              value={sceneConfig.animationSpeed || 1}
              onChange={handleChange}
              min="0.1"
              max="3"
              step="0.1"
            />
          </label>

          {/* Controle Play/Pause */}
          <label>
            Pausar Animação:
            <input
              type="checkbox"
              name="animationPaused"
              checked={sceneConfig.animationPaused || false}
              onChange={handleChange}
            />
          </label>

          {/* Controle do Bloom Effect */}
          <label>
                Bloom Ativado:
                <input
                    type="checkbox"
                    name="bloomEnabled"
                    checked={sceneConfig.bloomEffect?.enabled || false}
                    onChange={handleChange}
                />
            </label>
            <label>
                Intensidade do Bloom:
                <input
                    type="number"
                    name="bloomStrength"
                    value={sceneConfig.bloomEffect?.strength || 0}
                    onChange={handleChange}
                    step="0.01"
                />
            </label>
            <label>
                Raio do Bloom:
                <input
                    type="number"
                    name="bloomRadius"
                    value={sceneConfig.bloomEffect?.radius || 0}
                    onChange={handleChange}
                    step="0.01"
                />
            </label>
            <label>
                Threshold do Bloom:
                <input
                    type="number"
                    name="bloomThreshold"
                    value={sceneConfig.bloomEffect?.threshold || 0}
                    onChange={handleChange}
                    step="0.01"
                />
            </label>

            {/* Checklist de seleção de objetos com base em bloomEffect.status */}
      <div className="object-checklist">
        <h4>Objetos Carregados</h4>
        <ul>
          {Object.keys(objectsStatus).map((uuid) => (
            <li key={uuid}>
              <label>
                <input
                  type="checkbox"
                  name="bloomEffectSelection"
                  value={uuid}
                  checked={objectsStatus[uuid].status || false}
                  onChange={handleChange}
                />
                {objectsStatus[uuid].name || `Objeto ${uuid}`} {/* Exibe o nome do objeto */}
              </label>
              {objectsStatus[uuid].status && (
                <div>
                  Intensidade Emissiva:
                  <input
                    type="range"
                    name="emissiveIntensity"
                    data-uuid={uuid} // Armazena o uuid no data-attribute
                    min="0"
                    max="4"
                    step="0.1"
                    value={objectsStatus[uuid].emissiveIntensity || 1.0}
                    onChange={handleChange}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

           
        </div>
    );
    
};

export default ControlPanel;
