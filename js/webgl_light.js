'use strict';


const VSHADER_SOURCE = `

	attribute vec4 a_Position;
	attribute vec4 a_Normal;
	attribute vec2 a_TexCoord;
	attribute vec3 a_Tangent;
	
	uniform mat4 u_MVPMatrix;
	uniform mat4 u_NormalMatrix;
	uniform mat4 u_ModelMatrix;
	uniform bool u_IsUseDiffuseMap;
	uniform bool u_IsUseNormalMap;

	varying vec3 v_Position;
	varying vec3 v_Normal;
	varying vec2 v_TexCoord;
	varying mat3 v_TBN;
	
	void main() {

		gl_Position = u_MVPMatrix * a_Position;
		v_Position = vec3(u_ModelMatrix * a_Position);	
		v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));

			
		if (u_IsUseDiffuseMap || u_IsUseNormalMap) {
			v_TexCoord = a_TexCoord;
		}

		vec3 T = normalize(vec3(u_ModelMatrix * vec4(a_Tangent,   0.0)));
		vec3 N = normalize(vec3(u_ModelMatrix * a_Normal));
		T = normalize(T - dot(T, N) * N);
		vec3 B = cross(N, T);

		v_TBN = mat3(T, B, N);
	}
`;


const FSHADER_SOURCE =  `
	precision mediump float;

	struct Material {
		vec3 diffuseColor;
		vec3 ambientColor;
		vec3 specularColor;
		float specularExponent;
		float alpha;
	};

	struct Light {
		vec3 position;
		vec3 ambientColor;
		vec3 diffuseColor;
	};

	uniform sampler2D u_DiffuseMap;
	uniform bool u_IsUseDiffuseMap;
	uniform sampler2D u_NormalMap;
	uniform bool u_IsUseNormalMap;

	uniform Material u_Material;
	uniform Light u_Light;
	uniform vec3 u_ViewPosition;

	varying vec3 v_Position;
	varying vec3 v_Normal;
	varying vec2 v_TexCoord;
	varying mat3 v_TBN;

	void main() {
		
		vec3 normal = v_Normal;

		if (u_IsUseNormalMap) {
			normal = texture2D(u_NormalMap, v_TexCoord).rgb;
			normal = normalize(normal * 2.0 - 1.0);
			normal = normalize(v_TBN * normal);
		}

		vec3 lightDir = normalize(u_Light.position - v_Position);	
		float nDotL = max(dot(normal, lightDir), 0.0);
		
		vec3 ambient = u_Material.diffuseColor * u_Material.ambientColor * u_Light.ambientColor;
		vec3 diffuse = u_Material.diffuseColor * u_Light.diffuseColor * nDotL;

		vec3 viewDir = normalize(u_ViewPosition - v_Position);
		vec3 reflectDir = normalize(reflect(-lightDir, normal));
		float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_Material.specularExponent, 1.0));
		vec3 specular = spec * u_Material.specularColor;

		vec4 color =  vec4(ambient + diffuse + specular, u_Material.alpha);

		if (u_IsUseDiffuseMap) {
			color *= texture2D(u_DiffuseMap, v_TexCoord);
		}

		gl_FragColor = color;
	}
`;


const LIGHT_COLOR = [1.0, 1.0, 1.0];
const AMBIENT_COLOR = [0.5, 0.5, 0.5];
const LIGHT_POSITION = [5.0, 15.0, 20.0];

let _resourceManager = null;
 
const _models = {};
let _camera = null;

const _state = {

	isRotate: true,
	isUseNormalMap: false,
	isUseDiffuseMap: true,
	rotationAngle: 10,

	currentModel: null
};
  
  
function updateCurrentModel(deltaTime) {

	// update rotation
	
	if (_state.isRotate) {
		let rotationY = _state.rotationAngle * deltaTime;
		_state.currentModel.addRotation([0, rotationY, 0]);		
	}
}


function initModels(gl) {

	// Plane
	_models.plane = CreatePlane();
	_models.plane.init(gl);
	_models.plane.scale = vec3.clone([80, 1, 80]);
	_models.plane.materials['default'].diffuseColor = [0.8, 0.8, 0.8];


	// Cube
	_models.cube = CreateCube('brick.JPG', 'brick_norm.JPG');
	_models.cube.init(gl);


	// Nanosuit
	_models.nanosuit = _resourceManager.models['nanosuit.obj'];
	_models.nanosuit.init(gl);

	_state.currentModel = _models.cube;
}


function setLightAttributes(gl) {

	let u_Light_ambientColor = gl.getUniformLocation(gl.shaderProgram, "u_Light.ambientColor");
	gl.uniform3fv(u_Light_ambientColor, new Float32Array(AMBIENT_COLOR));

	let u_Light_diffuseColor = gl.getUniformLocation(gl.shaderProgram, "u_Light.diffuseColor");
	gl.uniform3fv(u_Light_diffuseColor, new Float32Array(LIGHT_COLOR));
		
	let u_Light_position = gl.getUniformLocation(gl.shaderProgram, "u_Light.position");
	gl.uniform3fv(u_Light_position, new Float32Array(LIGHT_POSITION));
}
  

function setCameraAttributes(gl, position) {
	let u_ViewPosition = gl.getUniformLocation(gl.shaderProgram, "u_ViewPosition");
	gl.uniform3fv(u_ViewPosition, new Float32Array(position));
}





function drawModel(gl, model, vpMatrix) {
	
	let meshes = model.meshes;

	if (meshes == null || meshes.length == 0)
		return;

	// Model matrix
	let modelMatrix = mat4.create();
	mat4.fromRotationTranslationScale(modelMatrix, model.quatRotate, model.position, model.scale);
		
	let u_ModelMatrix = gl.getUniformLocation(gl.shaderProgram, "u_ModelMatrix");
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);


	// Normal matrix
	let normalMatrix = mat4.create();	
	mat4.invert(normalMatrix, modelMatrix);
	mat4.transpose(normalMatrix, normalMatrix);		
		
	let u_NormalMatrix = gl.getUniformLocation(gl.shaderProgram, "u_NormalMatrix");
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);


	// Model View Projection matrix
	let mvpMatrix = mat4.create();
	mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);

	let u_mvpMatrix = gl.getUniformLocation(gl.shaderProgram, "u_MVPMatrix");
	gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);


	for(let i = 0; i < meshes.length; ++i) {

		let mesh = meshes[i];
		let material = model.materials[mesh.materialName];
		let diffuseMap = _resourceManager.getTexture(material.diffuseMap);
		let normalMap = _resourceManager.getTexture(material.normalMap);

		var u_Material_alpha = gl.getUniformLocation(gl.shaderProgram, "u_Material.alpha");
		var u_Material_diffuseColor = gl.getUniformLocation(gl.shaderProgram, "u_Material.diffuseColor");
		var u_Material_ambientColor = gl.getUniformLocation(gl.shaderProgram, "u_Material.ambientColor");
		var u_Material_specularColor = gl.getUniformLocation(gl.shaderProgram, "u_Material.specularColor");
		var u_Material_specularExponent = gl.getUniformLocation(gl.shaderProgram, "u_Material.specularExponent");

		gl.uniform1f(u_Material_alpha, material.alpha);
		gl.uniform3fv(u_Material_diffuseColor, material.diffuseColor);
		gl.uniform3fv(u_Material_ambientColor, material.ambientColor);
		gl.uniform3fv(u_Material_specularColor, material.specularColor);
		gl.uniform1f(u_Material_specularExponent, material.specularExponent);


		var u_IsUseDiffuseMap = gl.getUniformLocation(gl.shaderProgram, "u_IsUseDiffuseMap");

		if (mesh.hasTextureCoords && diffuseMap && _state.isUseDiffuseMap) {
	
			gl.uniform1i(u_IsUseDiffuseMap, 1);
	
			var u_DiffuseMap = gl.getUniformLocation(gl.shaderProgram, "u_DiffuseMap");
			gl.uniform1i(u_DiffuseMap, 0);
	
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, diffuseMap.object);
		}
		else {
			gl.uniform1i(u_IsUseDiffuseMap, 0);
		}


		var u_IsUseNormalMap = gl.getUniformLocation(gl.shaderProgram, "u_IsUseNormalMap");

		if (mesh.hasTextureCoords && mesh.hasTangents && normalMap && _state.isUseNormalMap) {
	
			gl.uniform1i(u_IsUseNormalMap, 1);
	
			var u_NormalMap = gl.getUniformLocation(gl.shaderProgram, "u_NormalMap");
			gl.uniform1i(u_NormalMap, 1);
	
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, normalMap.object);
		}
		else {	
			gl.uniform1i(u_IsUseNormalMap, 0);
		}

	
		// Draw mesh
		let vao = mesh.vao;
	
		gl.bindVertexArray(vao);
		gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
		gl.bindVertexArray(null);

		
	}
}



function start() {
	
	let canvas = document.getElementById("glCanvas");	
	let gl = initWebGL(canvas);

	if (!gl) {		
		console.log("WebGL is not initializing!");
		return;
	}

	// GL init
	gl.clearColor(0.7, 0.7, 0.7, 1.0);
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.enable(gl.DEPTH_TEST);


	_resourceManager = new ResourceManager(gl);
	_resourceManager.onload = () => { render(canvas, gl); }
	_resourceManager.loadResources();

}

function render(canvas, gl) {

	let aspect = canvas.width / canvas.height;			
	let shaderProgram = createShaderProgram(gl, FSHADER_SOURCE, VSHADER_SOURCE);	
	
	gl.useProgram(shaderProgram);
	gl.shaderProgram = shaderProgram;	
	
	initModels(gl);
	setLightAttributes(gl);


	_camera = new Camera(aspect);
	_camera.lookAt([0, 2, 6], [0, 0, 0], [0, 1, 0]);
	setCameraAttributes(gl, [0, 2, 6]);

	(function animloop(){		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		let vpMatrix = _camera.getVPMatrix();
		drawModel(gl, _models.plane, vpMatrix);
		drawModel(gl, _state.currentModel, vpMatrix);		
		updateCurrentModel(1.0 / 60.0);

		requestAnimFrame(animloop);		
	})();

}



window.onload = function(){
	start();
}


window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     ||
         function(callback, element) {
           return window.setTimeout(callback, 1000/60);
         };
    })(); 
