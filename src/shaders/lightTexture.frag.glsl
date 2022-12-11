uniform sampler2D iLightMap;
uniform sampler2D iEarthAlbedo;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
	vec4 mapCol = texture2D(iEarthAlbedo, vUv);
	vec4 lightCol = texture2D(iLightMap, vUv);
	float ambient = 0.1;

	vec3 lightDirection = vec3(iLightPos.xy - vPos.xy, iLightPos.z);

	float angle = max(dot(lightDirection, vNormal), ambient);
	float _angle = 1.0 - angle;
	float attenuation = pow(length(lightDirection) * 0.4, 4.0);
	float intensity = min(_angle * attenuation, 0.8);

	vec3 finalColor = (mapCol.rgb * pow(angle, 2.0) * 0.8) + (lightCol.rgb * intensity);

	gl_FragColor = vec4(finalColor, 1.0);
}