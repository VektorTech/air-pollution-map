uniform sampler2D iLightMap;
uniform sampler2D iEarthAlbedo;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec3 lightColor = vec3(0.902, 0.902, 0.902);
	vec3 ambientColor = vec3(0.1686, 0.1686, 0.1686);

	vec4 earthColor = texture2D(iEarthAlbedo, vUv);
	vec4 nightLight = texture2D(iLightMap, vUv);

	vec3 lightDirection = iLightPos - vPosition;
	vec3 lightDirectionNormalized = normalize(iLightPos - vPosition);
	vec3 viewDirection = normalize(cameraPosition - vPosition);

	float diffuse = max(dot(lightDirectionNormalized, vNormal), 0.0);

	vec3 reflectDirection = reflect(-lightDirection, vNormal);
	float specularity = pow(max(dot(viewDirection, reflectDirection), 0.0), 3.2);
	float specular = min(0.07 * specularity, 0.8);

	float attenuation = min(pow(length(lightDirection) * 0.4, 8.0) * 0.6 *
		(1.0 - specularity), 0.55);
	float fresnel = pow(0.75 - max(dot(vNormal, viewDirection), 0.0), 3.0);

	vec3 finalColor =
		earthColor.rgb *
		((ambientColor + specular + fresnel + diffuse) * lightColor) +
		(nightLight.rgb * attenuation);

	gl_FragColor = vec4(finalColor, 1.0);
}