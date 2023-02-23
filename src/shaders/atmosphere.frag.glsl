uniform vec3 iLightPos;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec3 lightDirection = iLightPos - vPosition;
	float dist = 1.0 - clamp(pow(distance(lightDirection, vNormal) * 0.2, 3.5), 0.0, 1.0);

	vec3 hue1 = vec3(0.9137, 0.851, 0.2941);
	vec3 hue2 = vec3(0.3922, 0.6667, 0.9255);

	vec3 viewDirection = normalize((vec4(cameraPosition, 1.0) * viewMatrix).xyz - vPosition);

	float fresnel = pow(0.32 - dot(vNormal, viewDirection), 6.0);

	vec3 finalColor = mix(hue1, hue2, dist) * fresnel;

	gl_FragColor = vec4(finalColor, fresnel);
}

