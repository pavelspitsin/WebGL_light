'use strict';

const TEXTURES_RESOURCES = [
    'brick.JPG', 
    'brick_norm.JPG'
];

const MODELS_RESOURCES = [
    'monkey.obj',
]


class Texture {

    constructor(path, object, data) {

        this.path = path;
        this.object = object;
        this.data = data;
    }
}



class ResourceManager {

    constructor(gl) {
        this.gl = gl;
        this.textures = {};
        this.models = {};
        this.resourcesLength = TEXTURES_RESOURCES.length + MODELS_RESOURCES.length;
        this.onload = null;
        this.isLoaded = false;
    }


    getTexture(name) {
        return this.textures[name];
    }


    loadResources() {

        if (!this.isLoaded) {

            this.counter = 0;
    
            for(let i = 0; i < TEXTURES_RESOURCES.length; ++i) {
                this.loadImage(TEXTURES_RESOURCES[i], this.textures);
            }
    
            for(let i = 0; i < MODELS_RESOURCES.length; ++i) {
                this.loadModel(MODELS_RESOURCES[i], this.models);
            }
        }
    }


    recourceLoaded() {
        this.counter++;
        if (this.counter == this.resourcesLength) {
            this.isLoaded = true;
            if (this.onload != null && this.onload != undefined) {
                this.onload();
            }
        }
    }


    loadModel(path, models) {

        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status !== 404) {

                let objLoader = new ObjLoader();
                let loadedModel = objLoader.load(xhr.responseText);

                models[path] = loadedModel;
                this.recourceLoaded();
            }
          }


        xhr.open('GET', './resources/Models/' + path, true);
        xhr.send();

    }


    loadImage(path, textures) {
        let image = new Image();

        image.onerror = () => {            
            console.log('Failed to load image');
            this.recourceLoaded();
        }

        image.onload = () => {

            let texture = gl.createTexture();
            if (!texture) {
              console.log('Failed to create the texture object');
              return;
            } 

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            textures[path] = new Texture(path, texture, image);
            this.recourceLoaded();
        };

        image.src = './resources/Textures/' + path;
    }

}