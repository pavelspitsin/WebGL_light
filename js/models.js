'use strict';


class Model {


    constructor(mesh, position, rotation, scale) {
        this.mesh = mesh;
        this.position = (position == null || position == undefined) ? vec3.create() : position;
        this.rotation = (rotation == null || rotation == undefined) ? vec3.create() : rotation;
        this.scale = (scale == null || scale == undefined) ? vec3.clone([1,1,1]) : scale;
    }

    init(gl) {
        this.mesh.init(gl);
    }
}


class Mesh {
    constructor(vertices, normals, /*colors,*/ indices, texture, texCoords) {
        this.vertices = new Float32Array(vertices);
        this.normals = new Float32Array(normals);
        //this.colors = new Float32Array(colors);
        this.indices = new Float32Array(indices);
        this.texture = texture;
        this.texCoords = new Float32Array(texCoords);
        this.initialized = false;
        this.vao = null;
    }

    init(gl) {
        this.vao = this.createBuffers(gl);
        this.initialized = true;
        return this;
    }

    get isUseTexture() {
        return this.texture != null && this.texture != undefined && 
                this.texCoords != null && this.texCoords != undefined;
      }

    createBuffers(gl) {

        let vao = gl.createVertexArray();	
        let indexBuffer = gl.createBuffer();
        
        gl.bindVertexArray(vao);
        initArrayBuffer(gl, new Float32Array(this.vertices), 3, gl.FLOAT, "a_Position");
        initArrayBuffer(gl, new Float32Array(this.normals), 3, gl.FLOAT, "a_Normal");
        //initArrayBuffer(gl, new Float32Array(this.colors), 3, gl.FLOAT, "a_Color");	

        if (this.isUseTexture)
            initArrayBuffer(gl, new Float32Array(this.texCoords), 2, gl.FLOAT, "a_TexCoord");	
                
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.indices), gl.STATIC_DRAW);		
            
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        
        return vao;
    }
}

  

function CreateCube(texture) {

    let mesh = CreateCubeMesh(texture);
    let position = vec3.create();
    let rotation = vec3.create();
    let scale = vec3.clone([1,1,1]);

    return new Model(mesh, position, rotation, scale);
}


function CreateCubeMesh(texture) {

    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    const vertices = [   // Coordinates
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
       -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
       -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ];

    const normals = [    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
       -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ];


    const texCoords = [
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    1.0, 0.0,     
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    1.0, 1.0,    
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    0.0, 0.0,    
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    1.0, 0.0,    
        0.0, 1.0,   1.0, 1.0,   1.0, 0.0,    0.0, 0.0,    
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    0.0, 1.0
    ];
    
    const indices = [
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
       12,13,14,  12,14,15,    // left
       16,17,18,  16,18,19,    // down
       20,21,22,  20,22,23     // back
    ];

    return new Mesh(vertices, normals, indices, texture, texCoords);
}