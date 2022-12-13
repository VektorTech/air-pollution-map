varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLightPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 worldPosition = (modelViewMatrix * vec4(position, 1.0));
  vPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * worldPosition;
}