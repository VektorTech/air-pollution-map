uniform sampler2D iCloudsAlphaMap;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
	vec4 cloudColor = texture2D(iCloudsAlphaMap, vUv);

	vec3 lightDirection = iLightPos - vPosition;
	vec3 lightDirectionNormalized = normalize(iLightPos - vPosition);

	float diffuse = max(dot(lightDirectionNormalized, vNormal), 0.01);

	vec3 final = cloudColor.rgb * diffuse;
	float y = (final.r * 0.299) + (final.g * 0.587) + (final.b * 0.114);

	gl_FragColor = vec4(vec3(1.0), y);
}