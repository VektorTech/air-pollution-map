uniform sampler2D lightTexture;
uniform sampler2D map;
uniform vec3 iResolution;
uniform vec3 lightPos;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
	vec4 mapCol = texture2D(map, vUv);
	vec4 lightCol = texture2D(lightTexture, vUv);

	vec3 lightDirection = vec3(lightPos.xy - (gl_FragCoord.xy / iResolution.xy), lightPos.z);
	lightDirection.x *= iResolution.x / iResolution.y;

	float angle = max(dot(lightDirection, vNormal), 0.0);
	float _angle = 1.0 - angle;
	float attenuation = pow(length(lightDirection) * 0.9, 5.0);
	float intensity = min(attenuation * _angle, 0.7);

	vec3 finalColor = (mapCol.rgb * pow(angle, 3.0) * 0.6) + (lightCol.rgb * intensity);

	gl_FragColor = vec4(finalColor, 1.0);
}