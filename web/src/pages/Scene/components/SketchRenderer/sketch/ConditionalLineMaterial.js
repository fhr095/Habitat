import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * parameters = {
 *  color: <hex>,
 *  linewidth: <float>,
 *  dashed: <boolean>,
 *  dashScale: <float>,
 *  dashSize: <float>,
 *  gapSize: <float>,
 *  resolution: <Vector2>, // to be set by renderer
 * }
 */

class ConditionalLineMaterial extends LineMaterial {
  constructor(parameters) {
    super(parameters);

    this.type = 'ConditionalLineMaterial';

    // Override the vertex shader with one that includes the conditional line logic
    this.vertexShader = `
      #include <common>
      #include <color_pars_vertex>
      #include <fog_pars_vertex>
      #include <logdepthbuf_pars_vertex>
      #include <clipping_planes_pars_vertex>

      uniform float linewidth;
      uniform vec2 resolution;

      attribute vec3 control0;
      attribute vec3 control1;
      attribute vec3 direction;

      attribute vec3 instanceStart;
      attribute vec3 instanceEnd;

      attribute vec3 instanceColorStart;
      attribute vec3 instanceColorEnd;

      varying vec2 vUv;

      #ifdef USE_DASH

        uniform float dashScale;
        attribute float instanceDistanceStart;
        attribute float instanceDistanceEnd;
        varying float vLineDistance;

      #endif

      void trimSegment( const in vec4 start, inout vec4 end ) {

        // trim end segment so it terminates between the camera plane and the near plane

        // conservative estimate of the near plane
        float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
        float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
        float nearEstimate = - 0.5 * b / a;

        float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

        end.xyz = mix( start.xyz, end.xyz, alpha );

      }

      void main() {

        #ifdef USE_COLOR

          vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

        #endif

        #ifdef USE_DASH

          vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;

        #endif

        float aspect = resolution.x / resolution.y;

        vUv = uv;

        // camera space
        vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
        vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

        // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
        // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
        // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
        // perhaps there is a more elegant solution -- WestLangley

        bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

        if ( perspective ) {

          if ( start.z < 0.0 && end.z >= 0.0 ) {

            trimSegment( start, end );

          } else if ( end.z < 0.0 && start.z >= 0.0 ) {

            trimSegment( end, start );

          }

        }

        // clip space
        vec4 clipStart = projectionMatrix * start;
        vec4 clipEnd = projectionMatrix * end;

        // ndc space
        vec2 ndcStart = clipStart.xy / clipStart.w;
        vec2 ndcEnd = clipEnd.xy / clipEnd.w;

        // direction
        vec2 dir = ndcEnd - ndcStart;

        // account for clip-space aspect ratio
        dir.x *= aspect;
        dir = normalize( dir );

        // perpendicular to dir
        vec2 offset = vec2( dir.y, - dir.x );

        // undo aspect ratio adjustment
        dir.x /= aspect;
        offset.x /= aspect;

        // sign flip
        if ( position.x < 0.0 ) offset *= - 1.0;

        // endcaps
        if ( position.y < 0.0 ) {

          offset += - dir;

        } else if ( position.y > 1.0 ) {

          offset += dir;

        }

        // adjust for linewidth
        offset *= linewidth;

        // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
        offset /= resolution.y;

        // select end
        vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

        // back to clip space
        offset *= clip.w;

        clip.xy += offset;

        gl_Position = clip;

        vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>
        #include <fog_vertex>

        // conditional logic
        // Transform the line segment ends and control points into camera clip space
        vec4 c0 = projectionMatrix * modelViewMatrix * vec4( control0, 1.0 );
        vec4 c1 = projectionMatrix * modelViewMatrix * vec4( control1, 1.0 );
        vec4 p0 = projectionMatrix * modelViewMatrix * vec4( instanceStart, 1.0 );
        vec4 p1 = projectionMatrix * modelViewMatrix * vec4( instanceStart + direction, 1.0 );

        c0 /= c0.w;
        c1 /= c1.w;
        p0 /= p0.w;
        p1 /= p1.w;

        // Get the direction of the segment and an orthogonal vector
        vec2 segDir = p1.xy - p0.xy;
        vec2 norm = vec2( - segDir.y, segDir.x );

        // Get control point directions from the line
        vec2 c0dir = c0.xy - p1.xy;
        vec2 c1dir = c1.xy - p1.xy;

        // If the vectors to the controls points are pointed in different directions away
        // from the line segment then the line should not be drawn.
        float d0 = dot( normalize( norm ), normalize( c0dir ) );
        float d1 = dot( normalize( norm ), normalize( c1dir ) );
        float discardFlag = float( sign( d0 ) != sign( d1 ) );
        gl_Position = discardFlag > 0.5 ? c0 : gl_Position;
        // end conditional line logic
      }
    `;
  }
}

// Set a flag to identify this material type
ConditionalLineMaterial.prototype.isConditionalLineMaterial = true;

export { ConditionalLineMaterial };