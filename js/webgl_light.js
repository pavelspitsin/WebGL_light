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

let _gl = null;
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
		_models[_state.currentModel].model.addRotation([0, rotationY, 0]);		
	}
}


function setCurrentModel(modelName) {

	let camEye = _models[modelName].camEye;
	let camCenter = _models[modelName].camCenter;

	_state.currentModel = modelName;
	_camera.lookAt(camEye, camCenter, [0,1,0]);
	setCameraAttributes(camEye);
}




function setLightAttributes() {

	let u_Light_ambientColor = _gl.getUniformLocation(_gl.shaderProgram, "u_Light.ambientColor");
	_gl.uniform3fv(u_Light_ambientColor, new Float32Array(AMBIENT_COLOR));

	let u_Light_diffuseColor = _gl.getUniformLocation(_gl.shaderProgram, "u_Light.diffuseColor");
	_gl.uniform3fv(u_Light_diffuseColor, new Float32Array(LIGHT_COLOR));
		
	let u_Light_position = _gl.getUniformLocation(_gl.shaderProgram, "u_Light.position");
	_gl.uniform3fv(u_Light_position, new Float32Array(LIGHT_POSITION));
}
  

function setCameraAttributes(position) {
	let u_ViewPosition = _gl.getUniformLocation(_gl.shaderProgram, "u_ViewPosition");
	_gl.uniform3fv(u_ViewPosition, new Float32Array(position));
}





function drawModel(model, vpMatrix) {
	
	let meshes = model.meshes;

	if (meshes == null || meshes.length == 0)
		return;

	// Model matrix
	let modelMatrix = mat4.create();
	mat4.fromRotationTranslationScale(modelMatrix, model.quatRotate, model.position, model.scale);
		
	let u_ModelMatrix = _gl.getUniformLocation(_gl.shaderProgram, "u_ModelMatrix");
	_gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);


	// Normal matrix
	let normalMatrix = mat4.create();	
	mat4.invert(normalMatrix, modelMatrix);
	mat4.transpose(normalMatrix, normalMatrix);		
		
	let u_NormalMatrix = _gl.getUniformLocation(_gl.shaderProgram, "u_NormalMatrix");
	_gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);


	// Model View Projection matrix
	let mvpMatrix = mat4.create();
	mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);

	let u_mvpMatrix = _gl.getUniformLocation(_gl.shaderProgram, "u_MVPMatrix");
	_gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);


	for(let i = 0; i < meshes.length; ++i) {

		let mesh = meshes[i];
		let material = model.materials[mesh.materialName];
		let diffuseMap = _resourceManager.getTexture(material.diffuseMap);
		let normalMap = _resourceManager.getTexture(material.normalMap);

		var u_Material_alpha = _gl.getUniformLocation(_gl.shaderProgram, "u_Material.alpha");
		var u_Material_diffuseColor = _gl.getUniformLocation(_gl.shaderProgram, "u_Material.diffuseColor");
		var u_Material_ambientColor = _gl.getUniformLocation(_gl.shaderProgram, "u_Material.ambientColor");
		var u_Material_specularColor = _gl.getUniformLocation(_gl.shaderProgram, "u_Material.specularColor");
		var u_Material_specularExponent = _gl.getUniformLocation(_gl.shaderProgram, "u_Material.specularExponent");

		_gl.uniform1f(u_Material_alpha, material.alpha);
		_gl.uniform3fv(u_Material_diffuseColor, material.diffuseColor);
		_gl.uniform3fv(u_Material_ambientColor, material.ambientColor);
		_gl.uniform3fv(u_Material_specularColor, material.specularColor);
		_gl.uniform1f(u_Material_specularExponent, material.specularExponent);


		var u_IsUseDiffuseMap = _gl.getUniformLocation(_gl.shaderProgram, "u_IsUseDiffuseMap");

		if (mesh.hasTextureCoords && diffuseMap && _state.isUseDiffuseMap) {
	
			_gl.uniform1i(u_IsUseDiffuseMap, 1);
	
			var u_DiffuseMap = _gl.getUniformLocation(_gl.shaderProgram, "u_DiffuseMap");
			_gl.uniform1i(u_DiffuseMap, 0);
	
			_gl.activeTexture(_gl.TEXTURE0);
			_gl.bindTexture(_gl.TEXTURE_2D, diffuseMap.object);
		}
		else {
			_gl.uniform1i(u_IsUseDiffuseMap, 0);
		}


		var u_IsUseNormalMap = _gl.getUniformLocation(_gl.shaderProgram, "u_IsUseNormalMap");

		if (mesh.hasTextureCoords && mesh.hasTangents && normalMap && _state.isUseNormalMap) {
	
			_gl.uniform1i(u_IsUseNormalMap, 1);
	
			var u_NormalMap = _gl.getUniformLocation(_gl.shaderProgram, "u_NormalMap");
			_gl.uniform1i(u_NormalMap, 1);
	
			_gl.activeTexture(_gl.TEXTURE1);
			_gl.bindTexture(_gl.TEXTURE_2D, normalMap.object);
		}
		else {	
			_gl.uniform1i(u_IsUseNormalMap, 0);
		}

	
		// Draw mesh
		let vao = mesh.vao;
	
		_gl.bindVertexArray(vao);
		_gl.drawElements(_gl.TRIANGLES, mesh.indices.length, _gl.UNSIGNED_SHORT, 0);
		_gl.bindVertexArray(null);

		
	}
}



function start() {
	
	let canvas = document.getElementById("glCanvas");	
	_gl = initWebGL(canvas);

	if (!_gl) {		
		console.log("WebGL is not initializing!");
		return;
	}

	// GL init
	_gl.clearColor(0.7, 0.7, 0.7, 1.0);
	_gl.viewport(0, 0, canvas.width, canvas.height);
	_gl.enable(gl.DEPTH_TEST);


	_resourceManager = new ResourceManager(_gl);
	_resourceManager.onload = () => { render(canvas); }
	_resourceManager.loadResources();

}

function render(canvas) {

	let aspect = canvas.width / canvas.height;			
	let shaderProgram = createShaderProgram(_gl, FSHADER_SOURCE, VSHADER_SOURCE);	
	
	_gl.useProgram(shaderProgram);
	_gl.shaderProgram = shaderProgram;	
	
	_camera = new Camera(aspect);

	setLightAttributes();

	initModels(gl, _models, _resourceManager);
	setCurrentModel('cube');

	(function animloop(){		
		_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

		let vpMatrix = _camera.getVPMatrix();
		drawModel(_models['plane'].model, vpMatrix);
		drawModel(_models[_state.currentModel].model, vpMatrix);		
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
