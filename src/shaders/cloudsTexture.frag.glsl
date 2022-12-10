uniform sampler2D alphaMap;
uniform vec3 iResolution;
uniform vec3 lightPos;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
	vec4 textureCol = texture2D(alphaMap, vUv);

	vec3 lightDirection = vec3(lightPos.xy - (gl_FragCoord.xy / iResolution.xy), lightPos.z);
	lightDirection.x *= iResolution.x / iResolution.y;

	float angle = max(dot(lightDirection, vNormal), 0.0);

	vec3 diffuse = textureCol.rgb * pow(angle, 3.0) * 0.6;
	float y = (diffuse.r * 0.299) + (diffuse.g * 0.587) + (diffuse.b * 0.114);

	gl_FragColor = vec4(vec3(1.0), y);
}