
function initWebGL(canvas) {
  gl = null;
  
  try {
    gl = canvas.getContext("webgl2");
  }
  catch(e) {}
  
  if (!gl) {
    alert("Unable to initialize WebGL2. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}


function createShader(gl, type, shaderSource) {
  
	let shader = gl.createShader(type);

	if (shader == null) {
		console.log('unable to create shader');
		return null;
	}

	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader); 

	let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!compiled) {
		let error = gl.getShaderInfoLog(shader);
		console.log('Failed to compile shader: ' + error);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function createShaderProgram(gl, fshader, vshader ) {
		 
	let vertexShader = createShader(gl, gl.FRAGMENT_SHADER, fshader);
	let fragmentShader = createShader(gl, gl.VERTEX_SHADER, vshader);

	if (!vertexShader || !fragmentShader) {
		return null;
	}

	var shaderProgram = gl.createProgram();

	if (!shaderProgram) {
		return null;
	}

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	
	let linked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
	if (!linked) {
		let error = gl.getProgramInfoLog(shaderProgram);
		console.log('Failed to link shaderProgram: ' + error);
		gl.deleteProgram(shaderProgram);
		gl.deleteShader(fragmentShader);
		gl.deleteShader(vertexShader);
		return null;
	}

	gl.deleteShader(fragmentShader);
	gl.deleteShader(vertexShader);
	
	return shaderProgram;

}


function initArrayBuffer(gl, data, num, type, attribName) {
	
	let buffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);	
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);	
	
	
	let attrib = getAttribIndex(gl, attribName);
	gl.vertexAttribPointer(attrib, num, type, false, 0, 0);
	gl.enableVertexAttribArray(attrib);	
	
	return buffer;
}


function getAttribIndex(gl, attributeName) {
	let attr = gl.getAttribLocation(gl.shaderProgram, attributeName);

	if (attr == -1) {
		console.log('Attribute "' + attributeName + '" not found.');
		return;
	}  

	return attr;
}