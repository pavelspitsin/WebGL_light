'use strict';


const VSHADER_SOURCE = `

	attribute vec4 a_Position;
	attribute vec4 a_Normal;
	attribute vec2 a_TexCoord;
	
	uniform mat4 u_MVPMatrix;
	uniform mat4 u_NormalMatrix;
	uniform mat4 u_ModelMatrix;
	uniform bool u_IsUseTexture;

	varying vec3 v_Position;
	varying vec3 v_Normal;
	varying vec2 v_TexCoord;
	
	void main() {

		gl_Position = u_MVPMatrix * a_Position;
		v_Position = vec3(u_ModelMatrix * a_Position);	
		v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
		if (u_IsUseTexture) {
			v_TexCoord = a_TexCoord;
		}
	}
`;


const FSHADER_SOURCE =  `
	precision mediump float;

	uniform float u_Alpha;
	uniform vec3 u_DiffuseColor;
	uniform vec3 u_AmbientColor;

	uniform sampler2D u_Sampler;
	uniform bool u_IsUseTexture;

	uniform vec3 u_LightPosition;
	uniform vec3 u_LightAmbientColor;
	uniform vec4 u_LightDiffuseColor;

	varying vec3 v_Position;
	varying vec3 v_Normal;
	varying vec2 v_TexCoord;

	void main() {
		
		vec3 lightDir = normalize(u_LightPosition - v_Position);	
		float nDotL = max(dot(v_Normal, lightDir), 0.0);
		
		vec3 ambient = u_AmbientColor + u_LightAmbientColor;
		vec3 diffuse = u_DiffuseColor * u_LightDiffuseColor.rgb * nDotL;
		vec4 color =  vec4(diffuse + ambient, u_Alpha);

		if (u_IsUseTexture) {
			color *= texture2D(u_Sampler, v_TexCoord);
		}

		gl_FragColor = color;
	}
`;


const ROTATE = true;  

const LIGHT_COLOR = [1.0, 1.0, 1.0, 1.0];
const AMBIENT_COLOR = [0.2, 0.2, 0.2];
const LIGHT_POSITION = [10.0, 10.0, 10.0];
const CAMERA_POSITION = [5.0, 14.0, 19.0];
const CAMERA_LOOK_AT = [0.0, 8.0, 0.0];


let _angle = 0;
let _resourceManager = null;
 
  

function angleChange(deltaTime) {
	_angle += 10 * deltaTime;	
	_angle = _angle % 360;
}
  
  

function initLightAttributes(gl) {

	let u_ambientColor = gl.getUniformLocation(gl.shaderProgram, "u_LightAmbientColor");
	gl.uniform3fv(u_ambientColor, new Float32Array(AMBIENT_COLOR));

	let u_LightDiffuseColor = gl.getUniformLocation(gl.shaderProgram, "u_LightDiffuseColor");
	gl.uniform4fv(u_LightDiffuseColor, new Float32Array(LIGHT_COLOR));
		
	let u_lightPosition = gl.getUniformLocation(gl.shaderProgram, "u_LightPosition");
	gl.uniform3fv(u_lightPosition, new Float32Array(LIGHT_POSITION));
}
  


function getViewPorjectionMatrix(aspect) {
	let projMat = mat4.create();	
	mat4.perspective(projMat, 45.0 * Math.PI / 180, aspect, 0.1, 100);	
		
	let viewMat = mat4.create(); 		
	mat4.lookAt(viewMat, CAMERA_POSITION, CAMERA_LOOK_AT, [0.0, 1.0, 0.0]);
		
	let mvMatrix = mat4.create();
	mat4.multiply(mvMatrix, projMat, viewMat);

	return mvMatrix;
}


function drawModel(gl, model, vpMatrix) {
	
	let meshes = model.meshes;

	if (meshes == null || meshes.length == 0)
		return;

	// Model matrix
	let modelMatrix = mat4.create();	

	mat4.translate(modelMatrix, modelMatrix, model.position);
	mat4.rotate(modelMatrix, modelMatrix, _angle * Math.PI / 180, [0.0, 1.0, 0.0]);
	mat4.scale(modelMatrix, modelMatrix, model.scale);	
		
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
		let texture = _resourceManager.getTexture(material.diffuseTexture);

		var u_Alpha = gl.getUniformLocation(gl.shaderProgram, "u_Alpha");
		var u_DiffuseColor = gl.getUniformLocation(gl.shaderProgram, "u_DiffuseColor");
		var u_AmbientColor = gl.getUniformLocation(gl.shaderProgram, "u_AmbientColor");

		gl.uniform1f(u_Alpha, material.alpha);
		gl.uniform3fv(u_DiffuseColor, material.diffuseColor);
		gl.uniform3fv(u_AmbientColor, material.ambientColor);


		if (mesh.isUseTexture && texture) {
	
			var u_IsUseTexture = gl.getUniformLocation(gl.shaderProgram, "u_IsUseTexture");
			gl.uniform1i(u_IsUseTexture, 1);
	
			var u_Sampler = gl.getUniformLocation(gl.shaderProgram, "u_Sampler");
			gl.uniform1i(u_Sampler, 0);
	
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture.object);
		}
		else {
			gl.uniform1i(u_IsUseTexture, 0);
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
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
	
	let model = _resourceManager.models['nanosuit.obj'];
	model.init(gl);
	
	let vpMatrix = getViewPorjectionMatrix(aspect);
		
	initLightAttributes(gl);

	(function animloop(){		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		drawModel(gl, model, vpMatrix);

		if (ROTATE) {
			angleChange(1.0 / 60.0);
		}
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
