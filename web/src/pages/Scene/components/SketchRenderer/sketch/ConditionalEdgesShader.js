// ConditionalEdgesShader.js com correções para evitar redefinições
import * as THREE from 'three';

export const ConditionalEdgesShader = {
  uniforms: {
    diffuse: {
      value: new THREE.Color()
    },
    opacity: {
      value: 1.0
    }
  },

  vertexShader: /* glsl */`
    // Adicionamos a declaração de precision para compatibilidade WebGL
    precision highp float;
    precision highp int;
    
    // NÃO redeclaramos position, modelViewMatrix ou projectionMatrix
    // pois são injetados automaticamente pelo Three.js
    
    // Apenas declaramos atributos adicionais que não são padrão
    attribute vec3 control0;
    attribute vec3 control1;
    attribute vec3 direction;

    varying vec3 vColor;
    varying vec2 vUv;

    void main() {
      vUv = vec2(0.0, 0.0); // valor padrão mesmo se não existir atributo uv
      vColor = vec3(1.0, 1.0, 1.0); // valor padrão mesmo se não existir atributo color
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Transform the line segment ends and control points into camera clip space
      vec4 c0 = projectionMatrix * modelViewMatrix * vec4(control0, 1.0);
      vec4 c1 = projectionMatrix * modelViewMatrix * vec4(control1, 1.0);
      vec4 p0 = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec4 p1 = projectionMatrix * modelViewMatrix * vec4(position + direction, 1.0);

      c0 /= c0.w;
      c1 /= c1.w;
      p0 /= p0.w;
      p1 /= p1.w;

      // Get the direction of the segment and an orthogonal vector
      vec2 dir = p1.xy - p0.xy;
      vec2 norm = vec2(-dir.y, dir.x);

      // Get control point directions from the line
      vec2 c0dir = c0.xy - p1.xy;
      vec2 c1dir = c1.xy - p1.xy;

      // If the vectors to the controls points are pointed in different directions away
      // from the line segment then the line should not be drawn.
      float d0 = dot(normalize(norm), normalize(c0dir));
      float d1 = dot(normalize(norm), normalize(c1dir));
      float discardFlag = float(sign(d0) != sign(d1));
      gl_Position = discardFlag > 0.5 ? c0 : gl_Position;
    }
  `,

  fragmentShader: /* glsl */`
    // Adicionamos a declaração de precision para compatibilidade WebGL
    precision highp float;
    precision highp int;
    
    uniform vec3 diffuse;
    uniform float opacity;
    
    varying vec3 vColor;
    varying vec2 vUv;
    
    void main() {
      vec3 outgoingLight = diffuse;
      gl_FragColor = vec4(outgoingLight, opacity);
    }
  `
};

// Função para usar como alternativa caso haja problemas com o shader original
export function createCompatibleMaterial(lineColor) {
  // Cria um material básico de linha que não depende de shaders complexos
  return new THREE.LineBasicMaterial({ 
    color: lineColor,
    linewidth: 1,
    transparent: true,
    opacity: 0.8
  });
}