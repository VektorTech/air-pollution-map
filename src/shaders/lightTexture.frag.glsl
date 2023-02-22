uniform sampler2D iLightMap;
uniform sampler2D iEarthAlbedo;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec3 lightColor = vec3(0.7686, 0.7451, 0.6431);
	vec3 ambientColor = vec3(0.0078, 0.0902, 0.1608);

	vec4 earthColor = texture2D(iEarthAlbedo, vUv);
	vec4 nightLight = texture2D(iLightMap, vUv);

	vec3 lightDirection = iLightPos - vPosition;
	vec3 lightDirectionNormalized = normalize(iLightPos - vPosition);
	vec3 viewDirection = normalize(cameraPosition - vPosition);
	vec3 reflectDirection = reflect(-lightDirection, vNormal);

	float diffuse = max(dot(lightDirectionNormalized, vNormal), 0.0);
	float specularity = max(dot(viewDirection, reflectDirection), 0.0);
	float attenuation = 0.9 - (diffuse + specularity * 0.12);
	float fresnel = pow(0.9 - max(dot(vNormal, viewDirection), 0.0), 2.5);

	vec3 finalColor =
		earthColor.rgb *
		((ambientColor + fresnel + diffuse) * lightColor) +
		(nightLight.rgb * attenuation);

	gl_FragColor = vec4(finalColor, 1.0);
}