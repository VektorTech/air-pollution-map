varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vLightPos;

void main() {
  vUv = uv;
  vNormal = mat3(modelViewMatrix) * normal;

  vec4 wordPosition = (modelViewMatrix * vec4(position, 1.0));
  vPos = wordPosition.xyz;

  gl_Position = projectionMatrix * wordPosition;
}