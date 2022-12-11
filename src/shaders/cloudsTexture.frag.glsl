uniform sampler2D iCloudsAlphaMap;
uniform vec3 iLightPos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
	vec4 textureCol = texture2D(iCloudsAlphaMap, vUv);

	vec3 lightDirection = vec3(iLightPos.xy - vPos.xy, iLightPos.z);

	float angle = max(dot(lightDirection, vNormal), 0.3);

	vec3 diffuse = textureCol.rgb * pow(angle, 2.0) * 0.8;
	float y = (diffuse.r * 0.299) + (diffuse.g * 0.587) + (diffuse.b * 0.114);

	gl_FragColor = vec4(vec3(1.0), y);
}