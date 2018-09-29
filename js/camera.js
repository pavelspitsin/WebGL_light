class Camera {
    constructor(aspect) {
        this._aspect = aspect
        this._fov = 45.0;
        this._near = 0.1;
        this._far = 100;

        this._projMatrix = mat4.create();
        this._viewMatrix = mat4.create();
        this._mvMatrix = mat4.create();

        this._needUpdateProjMatrix = true;
        this._needUpdateVPMatrix = true;

        this.lookAt([0, 0, 0], [0, 0, -1], [0, 1, 0]);
        this.updateVPMatrix();
    }

    get aspect() { return this._aspect; }
    set aspect(value) {
        this._aspect = value;
        this._needUpdateProjMatrix = true;
    }

    get fov() { return this._fov; }
    set fov(value) {
        this._fov = value;
        this._needUpdateProjMatrix = true;
    }

    get near() { return this._near; }
    set near(value) {
        this._near = value;
        this._needUpdateProjMatrix = true;
    }

    get far() { return this._far; }
    set far(value) {
        this._far = value;
        this._needUpdateProjMatrix = true;
    }


    lookAt(position, target, up) {

        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, position, target, up);

        this._viewMatrix = viewMatrix;
        this._needUpdateVPMatrix = true;
    }

    getViewMatrix() {
        return this._viewMatrix;
    }

    getProjMatrix() {
        this.updateProjMatrix();
        return this._projMatrix;
    }

    getVPMatrix() {   
        this.updateVPMatrix();    
        return this._mvMatrix;
    }


    updateProjMatrix() {       
        
        if (!this._needUpdateProjMatrix)
            return;
        
	    this._projMatrix = mat4.create();	
        mat4.perspective(this._projMatrix, this._fov * Math.PI / 180.0, this._aspect, this._near, this._far);
        
        this._needUpdateProjMatrix = false;
        this._needUpdateVPMatrix = true;
    }

    updateVPMatrix() {
        
        this.updateProjMatrix();

        if (this._needUpdateVPMatrix) {

            this._mvMatrix = mat4.create();
            mat4.multiply(this._mvMatrix, this._projMatrix, this._viewMatrix);    
                    
            this._needUpdateVPMatrix = false;
        }

    }
}