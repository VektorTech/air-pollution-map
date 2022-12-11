uniform sampler2D iLightMap;
uniform sampler2D iEarthAlbedo;
uniform vec3 iResolution;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
	vec4 mapCol = texture2D(iEarthAlbedo, vUv);
	vec4 lightCol = texture2D(iLightMap, vUv);

	vec3 lightDirection = vec3(iLightPos.xy - (gl_FragCoord.xy / iResolution.xy), iLightPos.z);
	lightDirection.x *= iResolution.x / iResolution.y;

	float angle = max(dot(lightDirection, vNormal), 0.0);
	float _angle = 1.0 - angle;
	float attenuation = pow(length(lightDirection) * 0.9, 5.0);
	float intensity = min(attenuation * _angle, 0.7);

	vec3 finalColor = (mapCol.rgb * pow(angle, 3.0) * 0.6) + (lightCol.rgb * intensity);

	gl_FragColor = vec4(finalColor, 1.0);
}