import React, { useContext } from "react";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { useAnimations } from "../../../../context/AnimationContext";
import { ModelContext } from "../../../../context/ModelContext";
import "./ControlPanel.scss";

const ControlPanel = () => {
    const { animations } = useAnimations() || {};
    const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
    const { currentModel } = useContext(ModelContext);

    const modelConfig = sceneConfig[currentModel] || {}; 
    const objectsStatus = modelConfig.bloomEffect?.status || {};

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setSceneConfig((prevConfig) => {
            const newValue = type === "checkbox" ? checked : value;
            const updatedModelConfig = { ...prevConfig[currentModel] };
        
            switch (name) {
                // Background color
                case "backgroundColor":
                    updatedModelConfig.backgroundColor = newValue;
                    break;
        
                // Camera settings
                case "cameraType":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        type: newValue,
                    };
                    break;
                case "autoRotate":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        autoRotate: checked,
                    };
                    break;
                case "autoRotateSpeed":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        autoRotateSpeed: parseFloat(newValue),
                    };
                    break;
                case "zoomEnabled":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        zoomEnabled: checked,
                    };
                    break;
                case "cameraPositionX":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        position: {
                            ...updatedModelConfig.camera.position,
                            x: parseFloat(newValue),
                        },
                    };
                    break;
                case "cameraPositionY":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        position: {
                            ...updatedModelConfig.camera.position,
                            y: parseFloat(newValue),
                        },
                    };
                    break;
                case "cameraPositionZ":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        position: {
                            ...updatedModelConfig.camera.position,
                            z: parseFloat(newValue),
                        },
                    };
                    break;
                case "cameraDirectionX":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        direction: {
                            ...updatedModelConfig.camera.direction,
                            x: parseFloat(newValue),
                        },
                    };
                    break;
                case "cameraDirectionY":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        direction: {
                            ...updatedModelConfig.camera.direction,
                            y: parseFloat(newValue),
                        },
                    };
                    break;
                case "cameraDirectionZ":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        direction: {
                            ...updatedModelConfig.camera.direction,
                            z: parseFloat(newValue),
                        },
                    };
                    break;
                case "movementLimitsMin":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        movementLimits: {
                            ...updatedModelConfig.camera.movementLimits,
                            y: [parseFloat(newValue), updatedModelConfig.camera.movementLimits?.y[1] || 0],
                        },
                    };
                    break;
                case "movementLimitsMax":
                    updatedModelConfig.camera = {
                        ...updatedModelConfig.camera,
                        movementLimits: {
                            ...updatedModelConfig.camera.movementLimits,
                            y: [updatedModelConfig.camera.movementLimits?.y[0] || 0, parseFloat(newValue)],
                        },
                    };
                    break;
        
                // Light settings
                case "lightType":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        type: newValue,
                    };
                    break;
                case "lightIntensity":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        intensity: parseFloat(newValue),
                    };
                    break;
                case "lightPositionX":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        position: {
                            ...updatedModelConfig.light.position,
                            x: parseFloat(newValue),
                        },
                    };
                    break;
                case "lightPositionY":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        position: {
                            ...updatedModelConfig.light.position,
                            y: parseFloat(newValue),
                        },
                    };
                    break;
                case "lightPositionZ":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        position: {
                            ...updatedModelConfig.light.position,
                            z: parseFloat(newValue),
                        },
                    };
                    break;
                case "lightQuantity":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        quantity: parseInt(newValue),
                    };
                    break;
                case "shadowsEnabled":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        shadowsEnabled: checked,
                    };
                    break;
                case "shadowIntensity":
                    updatedModelConfig.light = {
                        ...updatedModelConfig.light,
                        shadowIntensity: parseFloat(newValue),
                    };
                    break;
        
                // Material settings
                case "transparencyEnabled":
                    updatedModelConfig.materialSettings = {
                        ...updatedModelConfig.materialSettings,
                        transparencyEnabled: checked,
                    };
                    break;
                case "materialOpacity":
                    updatedModelConfig.materialSettings = {
                        ...updatedModelConfig.materialSettings,
                        materialOpacity: parseFloat(newValue),
                    };
                    break;
        
                // Render settings
                case "lodEnabled":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        lodEnabled: checked,
                    };
                    break;
                case "lodDistance":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        lodDistance: parseFloat(newValue),
                    };
                    break;
                case "ambientOcclusionEnabled":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        ambientOcclusionEnabled: checked,
                    };
                    break;
                case "pixelRatio":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        pixelRatio: parseFloat(newValue),
                    };
                    break;
                case "antiAliasingEnabled":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        antiAliasingEnabled: checked,
                    };
                    break;
        
                // Partículas
                case "particlesEnabled":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        particlesEnabled: checked,
                    };
                    break;
                case "particleCount":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        particleCount: parseInt(newValue),
                    };
                    break;
                case "particleSize":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        particleSize: parseFloat(newValue),
                    };
                    break;
                case "particleEffectType":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        particleEffectType: newValue,
                    };
                    break;
                case "fogEnabled":
                    updatedModelConfig.fogSettings = {
                        ...updatedModelConfig.fogSettings,
                        enabled: checked,
                    };
                    break;
                case "fogColor":
                    updatedModelConfig.fogSettings = {
                        ...updatedModelConfig.fogSettings,
                        color: newValue,
                    };
                    break;
                case "fogDensity":
                    updatedModelConfig.fogSettings = {
                        ...updatedModelConfig.fogSettings,
                        density: parseFloat(newValue),
                    };
                    break;
                case "waterEnabled":
                    updatedModelConfig.water = {
                        ...updatedModelConfig.water,
                        enabled: checked,
                    };
                    break;
                case "waterColor":
                    updatedModelConfig.water = {
                        ...updatedModelConfig.water,
                        color: newValue,
                    };
                    break;
                case "waterScale":
                    updatedModelConfig.water = {
                        ...updatedModelConfig.water,
                        scale: parseFloat(newValue),
                    };
                    break;
        
                // Skybox settings
                case "skyboxEnabled":
                    updatedModelConfig.skyboxSettings = {
                        ...updatedModelConfig.skyboxSettings,
                        enabled: checked,
                    };
                    break;
                case "environmentMapEnabled":
                    updatedModelConfig.skyboxSettings = {
                        ...updatedModelConfig.skyboxSettings,
                        environmentMapEnabled: checked,
                    };
                    break;
                case "texturePath":
                    updatedModelConfig.skyboxSettings = {
                        ...updatedModelConfig.skyboxSettings,
                        texturePath: newValue,
                    };
                    break;
        
                // Tone Mapping
                case "toneMappingEnabled":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        toneMappingEnabled: checked,
                    };
                    break;
        
                // envMapIntensity
                case "envMapIntensity":
                    updatedModelConfig.renderSettings = {
                        ...updatedModelConfig.renderSettings,
                        envMapIntensity: parseFloat(newValue),
                    };
                    break;
        
                // Metalness
                case "metalness":
                    updatedModelConfig.materialSettings = {
                        ...updatedModelConfig.materialSettings,
                        metalness: parseFloat(newValue),
                    };
                    break;
        
                // Roughness
                case "roughness":
                    updatedModelConfig.materialSettings = {
                        ...updatedModelConfig.materialSettings,
                        roughness: parseFloat(newValue),
                    };
                    break;
        
                // Animation
                case "animationIndex":
                    updatedModelConfig.animationIndex = parseInt(newValue, 10); // Animation index
                    break;
                case "animationSpeed":
                    updatedModelConfig.animationSpeed = parseFloat(newValue); // Animation speed
                    break;
                case "animationPaused":
                    updatedModelConfig.animationPaused = checked; // Animation play/pause
                    break;
        
                // Bloom effect
                case "bloomEnabled":
                    updatedModelConfig.bloomEffect = {
                        ...updatedModelConfig.bloomEffect,
                        enabled: checked,
                    };
                    break;
                case "bloomStrength":
                    updatedModelConfig.bloomEffect = {
                        ...updatedModelConfig.bloomEffect,
                        strength: parseFloat(newValue),
                    };
                    break;
                case "bloomRadius":
                    updatedModelConfig.bloomEffect = {
                        ...updatedModelConfig.bloomEffect,
                        radius: parseFloat(newValue),
                    };
                    break;
                case "bloomThreshold":
                    updatedModelConfig.bloomEffect = {
                        ...updatedModelConfig.bloomEffect,
                        threshold: parseFloat(newValue),
                    };
                    break;

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
                [currentModel]: {
                    ...updatedModelConfig,
                    bloomEffect: {
                        ...updatedModelConfig.bloomEffect,
                        status: {
                            ...updatedModelConfig.bloomEffect.status,
                            [value]: {
                                ...updatedModelConfig.bloomEffect.status[value], // Mantém o nome e emissiveIntensity
                                status: checked, // Atualiza apenas o status
                            },
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
                [currentModel]: {
                    ...updatedModelConfig,
                    bloomEffect: {
                        ...updatedModelConfig.bloomEffect,
                        status: {
                            ...updatedModelConfig.bloomEffect.status,
                            [uuid]: {
                                ...updatedModelConfig.bloomEffect.status[uuid],
                                emissiveIntensity: emissiveIntensity,
                            },
                        },
                    },
                },
            };

        default:
            return prevConfig;
        }
    return {
        ...prevConfig,
        [currentModel]: updatedModelConfig,
    };
});
}  

return (
    <div className="control-panel">
        <h3>Painel de Controle da Cena ({currentModel})</h3>

        {/* Cor de fundo */}
        <label>
            Cor do Fundo:
            <input
                type="color"
                name="backgroundColor"
                value={sceneConfig[currentModel]?.backgroundColor || "#000000"}
                onChange={handleChange}
            />
        </label>

        {/* Tipo de câmera */}
        <label>
            Tipo de Câmera:
            <select
                name="cameraType"
                value={sceneConfig[currentModel]?.camera?.type || "perspective"}
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
                value={sceneConfig[currentModel]?.camera?.position?.x || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="cameraPositionY"
                value={sceneConfig[currentModel]?.camera?.position?.y || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="cameraPositionZ"
                value={sceneConfig[currentModel]?.camera?.position?.z || 0}
                onChange={handleChange}
            />
        </label>

        {/* Direção da Câmera */}
        <label>
            Direção da Câmera (X, Y, Z):
            <input
                type="number"
                name="cameraDirectionX"
                value={sceneConfig[currentModel]?.camera?.direction?.x || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="cameraDirectionY"
                value={sceneConfig[currentModel]?.camera?.direction?.y || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="cameraDirectionZ"
                value={sceneConfig[currentModel]?.camera?.direction?.z || 0}
                onChange={handleChange}
            />
        </label>

        {/* Auto-Rotação */}
        <label>
            Auto-Rotação:
            <input
                type="checkbox"
                name="autoRotate"
                checked={sceneConfig[currentModel]?.camera?.autoRotate || false}
                onChange={handleChange}
            />
        </label>

        {/* Velocidade de Rotação */}
        <label>
            Velocidade de Rotação:
            <input
                type="number"
                name="autoRotateSpeed"
                value={sceneConfig[currentModel]?.camera?.autoRotateSpeed || 1}
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
                checked={sceneConfig[currentModel]?.camera?.zoomEnabled || false}
                onChange={handleChange}
            />
        </label>

        {/* Limites de Movimento */}
        <label>
            Limite de Movimento - Ângulo Mínimo:
            <input
                type="number"
                name="movementLimitsMin"
                value={sceneConfig[currentModel]?.camera?.movementLimits?.y[0] || 0}
                onChange={handleChange}
            />
        </label>
        <label>
            Limite de Movimento - Ângulo Máximo:
            <input
                type="number"
                name="movementLimitsMax"
                value={sceneConfig[currentModel]?.camera?.movementLimits?.y[1] || 0}
                onChange={handleChange}
            />
        </label>

        {/* Luzes */}
        <label>
            Tipo de Luz:
            <select
                name="lightType"
                value={sceneConfig[currentModel]?.light?.type || "ambient"}
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
                value={sceneConfig[currentModel]?.light?.intensity || 1}
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
                value={sceneConfig[currentModel]?.light?.position?.x || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="lightPositionY"
                value={sceneConfig[currentModel]?.light?.position?.y || 0}
                onChange={handleChange}
            />
            <input
                type="number"
                name="lightPositionZ"
                value={sceneConfig[currentModel]?.light?.position?.z || 0}
                onChange={handleChange}
            />
        </label>

        <label>
            Quantidade de Luzes:
            <input
                type="number"
                name="lightQuantity"
                value={sceneConfig[currentModel]?.light?.quantity || 1}
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
        checked={sceneConfig[currentModel]?.light?.shadowsEnabled || false}
        onChange={handleChange}
    />
</label>

<label>
    Intensidade das Sombras:
    <input
        type="range"
        name="shadowIntensity"
        value={sceneConfig[currentModel]?.light?.shadowIntensity || 0}
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
        checked={sceneConfig[currentModel]?.materialSettings?.transparencyEnabled || false}
        onChange={handleChange}
    />
</label>

<label>
    Opacidade do Material:
    <input
        type="range"
        name="materialOpacity"
        value={sceneConfig[currentModel]?.materialSettings?.materialOpacity || 1}
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
        checked={sceneConfig[currentModel]?.renderSettings?.antiAliasingEnabled || false}
        onChange={handleChange}
    />
</label>

{/* LOD */}
<label>
    LOD Habilitado:
    <input
        type="checkbox"
        name="lodEnabled"
        checked={sceneConfig[currentModel]?.renderSettings?.lodEnabled || false}
        onChange={handleChange}
    />
</label>

<label>
    Distância do LOD:
    <input
        type="number"
        name="lodDistance"
        value={sceneConfig[currentModel]?.renderSettings?.lodDistance || 0}
        onChange={handleChange}
    />
</label>

{/* Ambient Occlusion */}
<label>
    Ambient Occlusion Habilitado:
    <input
        type="checkbox"
        name="ambientOcclusionEnabled"
        checked={sceneConfig[currentModel]?.renderSettings?.ambientOcclusionEnabled || false}
        onChange={handleChange}
    />
</label>

{/* Pixel Ratio */}
<label>
    Pixel Ratio:
    <input
        type="number"
        name="pixelRatio"
        value={sceneConfig[currentModel]?.renderSettings?.pixelRatio || 1}
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
        checked={sceneConfig[currentModel]?.renderSettings?.particlesEnabled || false}
        onChange={handleChange}
    />
</label>

{/* Quantidade de Partículas */}
{sceneConfig[currentModel]?.renderSettings?.particlesEnabled && (
    <>
        <label>
            Quantidade de Partículas:
            <input
                type="number"
                name="particleCount"
                value={sceneConfig[currentModel]?.renderSettings?.particleCount || 0}
                onChange={handleChange}
            />
        </label>

        {/* Tamanho das Partículas */}
        <label>
            Tamanho das Partículas:
            <input
                type="number"
                name="particleSize"
                value={sceneConfig[currentModel]?.renderSettings?.particleSize || 0}
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
        value={sceneConfig[currentModel]?.renderSettings?.particleEffectType || "generic"}
        onChange={handleChange}
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
        checked={sceneConfig[currentModel]?.fogSettings?.enabled || false}
        onChange={handleChange}
    />
</label>

{/* Cor da Névoa */}
{sceneConfig[currentModel]?.fogSettings?.enabled && (
    <>
        <label>
            Cor da Névoa:
            <input
                type="color"
                name="fogColor"
                value={sceneConfig[currentModel]?.fogSettings?.color || "#FFFFFF"}
                onChange={handleChange}
            />
        </label>

        {/* Densidade da Névoa */}
        <label>
            Densidade da Névoa:
            <input
                type="number"
                name="fogDensity"
                value={sceneConfig[currentModel]?.fogSettings?.density || 0.001}
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
        checked={sceneConfig[currentModel]?.water?.enabled || false}
        onChange={handleChange}
    />
</label>

{/* Cor da Água */}
<label>
    Cor da Água:
    <input
        type="color"
        name="waterColor"
        value={sceneConfig[currentModel]?.water?.color || '#0000ff'}
        onChange={handleChange}
    />
</label>

{/* Escala da Água */}
<label>
    Escala da Água:
    <input
        type="number"
        name="waterScale"
        value={sceneConfig[currentModel]?.water?.scale || 1}
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
        checked={sceneConfig[currentModel]?.skyboxSettings?.enabled || false}
        onChange={handleChange}
    />
</label>

{/* Caminho da textura do Skybox */}
<label>
    Caminho da Textura do Skybox:
    <input
        type="text"
        name="texturePath"
        value={sceneConfig[currentModel]?.skyboxSettings?.texturePath || ''}
        onChange={handleChange}
    />
</label>

{/* Ativar/desativar Environment Map */}
<label>
    Environment Map Ativado:
    <input
        type="checkbox"
        name="environmentMapEnabled"
        checked={sceneConfig[currentModel]?.skyboxSettings?.environmentMapEnabled || false}
        onChange={handleChange}
    />
</label>

{/* Tone Mapping */}
<label>
    Tone Mapping:
    <input
        type="checkbox"
        name="toneMappingEnabled"
        checked={sceneConfig[currentModel]?.renderSettings?.toneMappingEnabled || false}
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
        value={sceneConfig[currentModel]?.renderSettings?.envMapIntensity || 1}
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
        value={sceneConfig[currentModel]?.materialSettings?.metalness || 0}
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
        value={sceneConfig[currentModel]?.materialSettings?.roughness || 0}
        onChange={handleChange}
    />
</label>

{/* Selecionar Animação */}
<label>
    Selecionar Animação:
    <select
        name="animationIndex"
        value={sceneConfig[currentModel]?.animationIndex || 0}
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
        value={sceneConfig[currentModel]?.animationSpeed || 1}
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
        checked={sceneConfig[currentModel]?.animationPaused || false}
        onChange={handleChange}
    />
</label>

{/* Controle do Bloom Effect */}
<label>
    Bloom Ativado:
    <input
        type="checkbox"
        name="bloomEnabled"
        checked={sceneConfig[currentModel]?.bloomEffect?.enabled || false}
        onChange={handleChange}
    />
</label>

<label>
    Intensidade do Bloom:
    <input
        type="number"
        name="bloomStrength"
        value={sceneConfig[currentModel]?.bloomEffect?.strength || 0}
        onChange={handleChange}
        step="0.01"
    />
</label>

<label>
    Raio do Bloom:
    <input
        type="number"
        name="bloomRadius"
        value={sceneConfig[currentModel]?.bloomEffect?.radius || 0}
        onChange={handleChange}
        step="0.01"
    />
</label>

<label>
    Threshold do Bloom:
    <input
        type="number"
        name="bloomThreshold"
        value={sceneConfig[currentModel]?.bloomEffect?.threshold || 0}
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
                        checked={objectsStatus[uuid]?.status || false}
                        onChange={handleChange}
                    />
                    {objectsStatus[uuid]?.name || `Objeto ${uuid}`} {/* Exibe o nome do objeto */}
                </label>
                {objectsStatus[uuid]?.status && (
                    <div>
                        Intensidade Emissiva:
                        <input
                            type="range"
                            name="emissiveIntensity"
                            data-uuid={uuid} // Armazena o uuid no data-attribute
                            min="0"
                            max="4"
                            step="0.1"
                            value={objectsStatus[uuid]?.emissiveIntensity || 1.0}
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
