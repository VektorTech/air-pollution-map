uniform sampler2D iLightMap;
uniform sampler2D iEarthAlbedo;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec3 lightColor = vec3(0.9882, 0.9765, 0.7098);
	vec3 ambientColor = vec3(0.2667, 0.1882, 0.0196);

	vec4 earthColor = texture2D(iEarthAlbedo, vUv);
	vec4 nightLight = texture2D(iLightMap, vUv);

	vec3 lightDirection = iLightPos - vPosition;
	vec3 lightDirectionNormalized = normalize(iLightPos - vPosition);
	vec3 viewDirection = normalize((vec4(cameraPosition, 1.0) * viewMatrix).xyz - vPosition);

	vec3 reflectDirection = reflect(-lightDirection, vNormal);
	float specularity = max(dot(viewDirection, reflectDirection), 0.0) * 0.32;

	float diffuse = max(dot(lightDirectionNormalized, vNormal), 0.0);
	float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.05), 3.5);

	vec3 finalColor =
		earthColor.rgb *
		((ambientColor + fresnel + diffuse + specularity) * lightColor) +
		nightLight.rgb *
		(1.0 - min(diffuse + specularity, 1.0));

	gl_FragColor = vec4(finalColor, 1.0);
}

