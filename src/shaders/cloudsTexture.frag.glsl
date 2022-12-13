uniform sampler2D iCloudsAlphaMap;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec4 cloudColor = texture2D(iCloudsAlphaMap, vUv);

	vec3 lightDirection = iLightPos - vPosition;
	vec3 lightDirectionNormalized = normalize(iLightPos - vPosition);
	vec3 viewDirection = normalize(cameraPosition - vPosition);

	float diffuse = max(dot(lightDirectionNormalized, vNormal), 0.02);
	vec3 reflectDirection = reflect(-lightDirection, vNormal);
	float specularity = pow(max(dot(viewDirection, reflectDirection), 0.0), 3.2);
	float specular = min(0.08 * specularity, 0.7);

	vec3 final = cloudColor.rgb * (diffuse + specular);
	float y = min((final.r * 0.299) + (final.g * 0.587) + (final.b * 0.114), 0.65);

	gl_FragColor = vec4(vec3(0.9), y);
}